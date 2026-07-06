import {
  AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal,
} from '@angular/core';

import { AvisoService } from '../../community/aviso.service';
import { Aviso } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS } from '../../community/aviso.ui';
import { EventoService } from '../../community/evento.service';
import { Evento } from '../../community/evento.models';
import { expandirEvento, etiquetaRecurrencia } from '../../core/recurrence.util';
import { MapsLoader } from '../../core/maps-loader';
import { environment } from '../../../environments/environment';

declare const google: any;

/** Un punto en el mapa: proviene de un aviso del tablón o de un evento. */
interface MapItem {
  id: string;
  filtro: string;        // clave de filtro (categoría de aviso o 'EVENTOS')
  tipoLabel: string;     // etiqueta legible del tipo
  color: string;
  esEvento: boolean;     // true = marcador estrella; false = círculo (aviso)
  titulo: string;
  descripcion: string;
  lat: number;
  lng: number;
  extra?: string;        // dirección (aviso) o próxima fecha (evento)
  autor: string;
}

/** Path SVG de una estrella de 5 puntas (para diferenciar eventos de avisos). */
const ESTRELLA_PATH = 'M 0,-11 L 2.6,-3.4 L 10.5,-3.4 L 4.1,1.3 L 6.6,9 L 0,4.3 L -6.6,9 L -4.1,1.3 L -10.5,-3.4 L -2.6,-3.4 Z';

interface FiltroMapa { value: string; label: string; color: string; }

const COLOR_EVENTO = '#f59e0b'; // amarillo/ámbar

const FILTROS_MAPA: FiltroMapa[] = [
  { value: 'TODOS', label: 'Todos', color: '#003087' },
  { value: 'SERVICIO', label: 'Servicios', color: AVISO_COLORS['SERVICIO'] },
  { value: 'COMPRA_VENTA', label: 'Compra/Venta', color: AVISO_COLORS['COMPRA_VENTA'] },
  { value: 'ARRIENDO', label: 'Arriendos', color: AVISO_COLORS['ARRIENDO'] },
  { value: 'PERDIDO_ENCONTRADO', label: 'Perdidos', color: AVISO_COLORS['PERDIDO_ENCONTRADO'] },
  { value: 'EVENTOS', label: 'Eventos', color: COLOR_EVENTO },
];

/** Sección Mapa — avisos del tablón y eventos geolocalizados (Google Maps). Centrado en la sede vecinal. */
@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
<section class="hero hero-mapa">
  <div class="hero-inner">
    <h1>Mapa Comunitario</h1>
    <p>Servicios, compra-venta, arriendos, eventos y publicaciones geolocalizadas de la comunidad.</p>
  </div>
</section>
<div class="mapa-layout">
  <div class="mapa-left"><div #mapContainer class="map-full"></div></div>
  <aside class="mapa-sidebar">
    <div class="sidebar-head">
      <strong>En el mapa</strong>
      <span class="count-badge">{{ itemsFiltrados().length }}</span>
    </div>
    <div class="sidebar-filters">
      @for (f of filtros; track f.value) {
        <button class="map-pill" [class.active]="mapaFiltro()===f.value" [style.--c]="f.color"
                (click)="setFiltro(f.value)">{{ f.label }}</button>
      }
    </div>
    <div class="sidebar-list">
      @if (itemsFiltrados().length === 0) {
        <p class="msg-muted" style="padding:1rem;font-size:.82rem">Sin puntos en esta categoría.</p>
      }
      @for (it of itemsFiltrados(); track it.id) {
        <div class="list-item" [class.active]="selectedId()===it.id" (click)="seleccionar(it)">
          <div class="list-item-top">
            @if (it.esEvento) {
              <span class="tipo-star" [style.color]="it.color">★</span>
            } @else {
              <span class="tipo-dot" [style.background]="it.color"></span>
            }
            <span class="list-item-tipo">{{ it.tipoLabel }}</span>
          </div>
          <div class="list-item-title">{{ it.titulo }}</div>
          @if (it.extra) { <div class="list-item-dir">📍 {{ it.extra }}</div> }
          @if (selectedId()===it.id) {
            <div class="list-item-detail">
              <p>{{ it.descripcion }}</p>
              <span class="msg-muted" style="font-size:.72rem">{{ it.autor }}</span>
            </div>
          }
        </div>
      }
    </div>
    <div class="sidebar-legend">
      @for (f of filtros; track f.value) {
        @if (f.value !== 'TODOS' && f.value !== 'EVENTOS') {
          <span class="leg"><span class="tipo-dot" [style.background]="f.color"></span>{{ f.label }}</span>
        }
      }
      <span class="leg"><span class="tipo-star">★</span>Eventos <span class="leg-nota">(color a elección)</span></span>
    </div>
  </aside>
</div>
  `,
})
export class Mapa implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private readonly avisoSvc = inject(AvisoService);
  private readonly eventoSvc = inject(EventoService);
  private readonly loader = inject(MapsLoader);
  protected readonly filtros = FILTROS_MAPA;
  private readonly sede = environment.communitySede;

  avisos = signal<Aviso[]>([]);
  eventos = signal<Evento[]>([]);
  mapaFiltro = signal<string>('TODOS');
  selectedId = signal<string | null>(null);

  private map: any = null;
  private infoWindow: any = null;
  private currentCenter: any = null;
  private markers = new Map<string, any>();

  /** Todos los puntos (avisos aprobados + eventos con coordenadas). */
  items = (): MapItem[] => {
    const out: MapItem[] = [];
    this.avisos()
      .filter((a) => a.latitud != null && a.longitud != null && a.estado === 'APROBADO')
      .forEach((a) => out.push({
        id: 'a-' + a.id,
        filtro: a.categoria,
        tipoLabel: AVISO_LABELS[a.categoria] ?? a.categoria,
        color: AVISO_COLORS[a.categoria] ?? '#6366f1',
        esEvento: false,
        titulo: a.titulo,
        descripcion: a.descripcion + (a.precio != null ? ` — $ ${a.precio}` : ''),
        lat: a.latitud!, lng: a.longitud!,
        extra: a.direccion ?? undefined,
        autor: a.authorEmail,
      }));
    this.eventos()
      .filter((e) => e.latitud != null && e.longitud != null)
      .forEach((e) => out.push({
        id: 'e-' + e.id,
        filtro: 'EVENTOS',
        tipoLabel: e.subcategoria ? 'Evento · ' + e.subcategoria : 'Evento',
        color: e.color || COLOR_EVENTO,
        esEvento: true,
        titulo: e.titulo,
        descripcion: e.descripcion,
        lat: e.latitud!, lng: e.longitud!,
        extra: this.proximaFecha(e),
        autor: e.authorEmail,
      }));
    return out;
  };

  itemsFiltrados = (): MapItem[] => {
    const f = this.mapaFiltro();
    return f === 'TODOS' ? this.items() : this.items().filter((i) => i.filtro === f);
  };

  ngOnInit(): void {
    this.avisoSvc.getAll().subscribe({ next: (d) => { this.avisos.set(d); this.refreshMarkers(); } });
    this.eventoSvc.getAll().subscribe({ next: (d) => { this.eventos.set(d); this.refreshMarkers(); } });
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loader.load();
      this.initMap();
    } catch (e) {
      console.error('Google Maps no disponible', e);
    }
  }

  setFiltro(f: string): void { this.mapaFiltro.set(f); this.selectedId.set(null); this.refreshMarkers(); }

  seleccionar(it: MapItem): void {
    this.selectedId.set(it.id);
    const marker = this.markers.get(it.id);
    if (this.map && marker) {
      this.map.panTo({ lat: it.lat, lng: it.lng });
      this.map.setZoom(17);
      this.openInfo(it, marker);
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
      google.maps.event.trigger(this.map, 'resize');
      this.map.setCenter(this.currentCenter ?? fallback);
    }, 250);
  }

  /** Geocodifica la dirección de la sede para centrar con precisión y marcarla. */
  private placeSede(fallback: { lat: number; lng: number }): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: this.sede.direccion + ', Chile' }, (results: any, status: string) => {
      const pos = status === 'OK' && results?.[0] ? results[0].geometry.location : fallback;
      this.currentCenter = pos;
      this.map.setCenter(pos);
      google.maps.event.trigger(this.map, 'resize');
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
    this.itemsFiltrados().forEach((it) => {
      const marker = new google.maps.Marker({
        position: { lat: it.lat, lng: it.lng },
        map: this.map,
        title: it.titulo,
        icon: it.esEvento
          ? { path: ESTRELLA_PATH, scale: 1.5, fillColor: it.color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.5 }
          : { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: it.color, fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
      });
      marker.addListener('click', () => { this.selectedId.set(it.id); this.openInfo(it, marker); });
      this.markers.set(it.id, marker);
    });
  }

  private openInfo(it: MapItem, marker: any): void {
    if (!this.infoWindow) return;
    const extra = it.extra
      ? `<br><span style="font-size:.78rem;color:#6b7280;display:block;margin-top:4px">📍 ${it.extra}</span>`
      : '';
    this.infoWindow.setContent(
      `<div style="min-width:200px;font-family:system-ui"><strong style="font-size:.9rem">${it.titulo}</strong><br>` +
      `<span style="font-size:.7rem;background:${it.color};color:#fff;padding:1px 7px;border-radius:999px;font-weight:700">${it.tipoLabel}</span>` +
      `${extra}<p style="margin:6px 0 2px;font-size:.82rem;color:#374151">${it.descripcion}</p>` +
      `<span style="font-size:.72rem;color:#9ca3af">${it.autor}</span></div>`,
    );
    this.infoWindow.open(this.map, marker);
  }

  /** Próxima ocurrencia de un evento (para mostrar en el mapa). */
  private proximaFecha(e: Evento): string {
    const ahora = new Date();
    const hasta = new Date(ahora); hasta.setFullYear(hasta.getFullYear() + 2);
    const occ = expandirEvento(e, ahora, hasta)[0];
    const fecha = occ ? occ.fechaInicio : new Date(e.fechaInicio);
    const f = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const rec = e.recurrente ? ` · 🔁 ${etiquetaRecurrencia(e)}` : '';
    return f + rec;
  }
}
