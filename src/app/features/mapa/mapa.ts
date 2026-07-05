import {
  AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal,
} from '@angular/core';

import { AvisoService } from '../../community/aviso.service';
import { Aviso } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS, AVISO_FILTROS } from '../../community/aviso.ui';
import { MapsLoader } from '../../core/maps-loader';
import { environment } from '../../../environments/environment';

declare const google: any;

/** Sección Mapa — avisos del tablón geolocalizados (Google Maps). Centrado en la sede vecinal. */
@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
<section class="hero hero-mapa">
  <div class="hero-inner">
    <h1>Mapa Comunitario</h1>
    <p>Servicios, compra-venta, arriendos y publicaciones geolocalizadas de la comunidad.</p>
  </div>
</section>
<div class="mapa-layout">
  <div class="mapa-left"><div #mapContainer class="map-full"></div></div>
  <aside class="mapa-sidebar">
    <div class="sidebar-head">
      <strong>Publicaciones</strong>
      <span class="count-badge">{{ avisosConUbicacion().length }}</span>
    </div>
    <div class="sidebar-filters">
      @for (f of filtros; track f.value) {
        <button class="map-pill" [class.active]="mapaFiltro()===f.value" [style.--c]="f.color"
                (click)="setFiltro(f.value)">{{ f.label }}</button>
      }
    </div>
    <div class="sidebar-list">
      @if (avisosFiltrados().length === 0) {
        <p class="msg-muted" style="padding:1rem;font-size:.82rem">Sin publicaciones en esta categoría.</p>
      }
      @for (a of avisosFiltrados(); track a.id) {
        <div class="list-item" [class.active]="selectedId()===a.id" (click)="seleccionar(a)">
          <div class="list-item-top">
            <span class="tipo-dot" [style.background]="AVISO_COLORS[a.categoria]??'#9ca3af'"></span>
            <span class="list-item-tipo">{{ AVISO_LABELS[a.categoria] ?? a.categoria }}</span>
          </div>
          <div class="list-item-title">{{ a.titulo }}</div>
          @if (a.direccion) { <div class="list-item-dir">📍 {{ a.direccion }}</div> }
          @if (selectedId()===a.id) {
            <div class="list-item-detail">
              <p>{{ a.descripcion }}</p>
              @if (a.precio != null) { <p class="card-precio">$ {{ a.precio }}</p> }
              <span class="msg-muted" style="font-size:.72rem">{{ a.authorEmail }}</span>
            </div>
          }
        </div>
      }
    </div>
    <div class="sidebar-legend">
      @for (f of filtros; track f.value) {
        @if (f.value !== 'TODOS') {
          <span class="leg"><span class="tipo-dot" [style.background]="f.color"></span>{{ f.label }}</span>
        }
      }
    </div>
  </aside>
</div>
  `,
})
export class Mapa implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly svc = inject(AvisoService);
  private readonly loader = inject(MapsLoader);
  protected readonly AVISO_COLORS = AVISO_COLORS;
  protected readonly AVISO_LABELS = AVISO_LABELS;
  protected readonly filtros = AVISO_FILTROS;
  private readonly sede = environment.communitySede;

  avisos = signal<Aviso[]>([]);
  mapaFiltro = signal<'TODOS' | Aviso['categoria']>('TODOS');
  selectedId = signal<string | null>(null);

  private map: any = null;
  private infoWindow: any = null;
  private currentCenter: any = null;
  private markers = new Map<string, any>();

  avisosConUbicacion = () =>
    this.avisos().filter((a) => a.latitud != null && a.longitud != null && a.estado === 'APROBADO');
  avisosFiltrados = () => {
    const f = this.mapaFiltro();
    return f === 'TODOS' ? this.avisosConUbicacion() : this.avisosConUbicacion().filter((a) => a.categoria === f);
  };

  ngOnInit(): void {
    this.svc.getAll().subscribe({ next: (d) => { this.avisos.set(d); this.refreshMarkers(); } });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loader.load();
      this.initMap();
    } catch (e) {
      console.error('Google Maps no disponible', e);
    }
  }

  setFiltro(f: 'TODOS' | Aviso['categoria']): void { this.mapaFiltro.set(f); this.selectedId.set(null); }

  seleccionar(a: Aviso): void {
    this.selectedId.set(a.id);
    const marker = this.markers.get(a.id);
    if (a.latitud && a.longitud && this.map && marker) {
      this.map.panTo({ lat: a.latitud, lng: a.longitud });
      this.map.setZoom(17);
      this.openInfo(a, marker);
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement || this.map) return;
    const fallback = { lat: this.sede.latitud, lng: this.sede.longitud };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: fallback, zoom: 15, mapTypeControl: false, streetViewControl: false,
    });
    this.infoWindow = new google.maps.InfoWindow();
    this.placeSede(fallback);
    this.refreshMarkers();
    setTimeout(() => {
      if (!this.map) return;
      google.maps.event.trigger(this.map, "resize");
      this.map.setCenter(this.currentCenter ?? fallback);
    }, 250);
  }

  /** Geocodifica la dirección de la sede para centrar con precisión y marcarla. */
  private placeSede(fallback: { lat: number; lng: number }): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: this.sede.direccion + ', Chile' }, (results: any, status: string) => {
      const pos = status === "OK" && results?.[0] ? results[0].geometry.location : fallback;
      this.currentCenter = pos;
      this.map.setCenter(pos);
      google.maps.event.trigger(this.map, "resize");
      const sedeMarker = new google.maps.Marker({
        position: pos, map: this.map, title: this.sede.nombre, zIndex: 999,
      });
      const iw = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui"><strong>🏛️ ${this.sede.nombre}</strong>` +
                 `<br><span style="font-size:.8rem;color:#6b7280">${this.sede.direccion}</span></div>`,
      });
      sedeMarker.addListener('click', () => iw.open(this.map, sedeMarker));
    });
  }

  private refreshMarkers(): void {
    if (!this.map) return;
    this.markers.forEach((m) => m.setMap(null));
    this.markers.clear();
    this.avisosConUbicacion().forEach((a) => {
      const color = AVISO_COLORS[a.categoria] ?? '#6366f1';
      const marker = new google.maps.Marker({
        position: { lat: a.latitud!, lng: a.longitud! },
        map: this.map,
        title: a.titulo,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9, fillColor: color, fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2,
        },
      });
      marker.addListener('click', () => { this.selectedId.set(a.id); this.openInfo(a, marker); });
      this.markers.set(a.id, marker);
    });
  }

  private openInfo(a: Aviso, marker: any): void {
    if (!this.infoWindow) return;
    const color = AVISO_COLORS[a.categoria] ?? '#6366f1';
    const precio = a.precio != null ? `<p style="margin:4px 0 2px;font-weight:700;color:#047857">$ ${a.precio}</p>` : '';
    const dir = a.direccion ? `<br><span style="font-size:.78rem;color:#6b7280;display:block;margin-top:4px">📍 ${a.direccion}</span>` : '';
    this.infoWindow.setContent(
      `<div style="min-width:200px;font-family:system-ui"><strong style="font-size:.9rem">${a.titulo}</strong><br>` +
      `<span style="font-size:.7rem;background:${color};color:#fff;padding:1px 7px;border-radius:999px;font-weight:700">${AVISO_LABELS[a.categoria] ?? a.categoria}</span>` +
      `${dir}<p style="margin:6px 0 2px;font-size:.82rem;color:#374151">${a.descripcion}</p>${precio}` +
      `<span style="font-size:.72rem;color:#9ca3af">${a.authorEmail}</span></div>`
    );
    this.infoWindow.open(this.map, marker);
  }
}
