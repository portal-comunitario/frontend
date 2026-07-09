import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject,
} from '@angular/core';

import { MapsLoader } from '../../core/maps-loader';
import { TenantService } from '../../tenant/tenant.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-map-picker',
  standalone: true,
  template: `
<div class="picker">
  <div #pickerMap class="picker-map"></div>
  <div class="picker-bar">
    @if (lat != null && lng != null) {
      <span class="picker-ok">📍 Ubicación fijada</span>
      <button type="button" class="picker-clear" (click)="limpiar()">Quitar</button>
    } @else {
      <span class="picker-hint">Haz clic en el mapa para fijar dónde será el evento.</span>
    }
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .picker { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .picker-map { width: 100%; height: 220px; background: #eef2f7; }
    .picker-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: #f9fafb; font-size: 0.78rem; }
    .picker-ok { color: #047857; font-weight: 600; }
    .picker-hint { color: #6b7280; }
    .picker-clear { background: #fff; border: 1px solid #fca5a5; color: #dc2626; border-radius: 5px; padding: 2px 8px; font-size: 0.74rem; cursor: pointer; }
  `],
})
export class MapPicker implements AfterViewInit {
  @ViewChild('pickerMap') mapEl!: ElementRef<HTMLDivElement>;

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Output() picked = new EventEmitter<{ lat: number | null; lng: number | null }>();

  private readonly loader = inject(MapsLoader);
  private readonly tenant = inject(TenantService);
  private get sede() {
    const t = this.tenant.sede();
    if (t) {
      return { nombre: t.nombre, direccion: t.direccion,
               latitud: environment.communitySede.latitud, longitud: environment.communitySede.longitud };
    }
    return environment.communitySede;
  }
  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loader.load();
      this.initMap();
    } catch (e) {
      console.error('Google Maps no disponible', e);
    }
  }

  private initMap(): void {
    if (!this.mapEl?.nativeElement || this.map) return;
    const sedeFallback = { lat: this.sede.latitud, lng: this.sede.longitud };
    const center = this.lat != null && this.lng != null ? { lat: this.lat, lng: this.lng } : sedeFallback;
    this.map = new google.maps.Map(this.mapEl.nativeElement, {
      center, zoom: 15, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    this.geocoder = new google.maps.Geocoder();
    if (this.lat != null && this.lng != null) {
      this.setMarker(this.lat, this.lng);
    } else {
      this.geocoder.geocode({ address: this.sede.direccion + ', Chile' }, (r: any, s: string) => {
        const pos = s === 'OK' && r?.[0] ? r[0].geometry.location : sedeFallback;
        if (this.map) this.map.setCenter(pos);
      });
    }
    this.map.addListener('click', (e: any) => {
      this.setMarker(e.latLng.lat(), e.latLng.lng());
    });
    const relayout = () => { if (this.map) { google.maps.event.trigger(this.map, 'resize'); this.map.setCenter(this.marker ? this.marker.getPosition() : center); } };
    setTimeout(relayout, 250);
    setTimeout(relayout, 700);
  }

  /** Busca una dirección escrita y coloca el pin ahí (se ancla a la comuna de la sede). */
  buscarDireccion(direccion: string): void {
    const dir = (direccion ?? '').trim();
    if (!dir || !this.map) return;
    if (!this.geocoder) this.geocoder = new google.maps.Geocoder();
    const comuna = this.sede.direccion.split(',').pop()?.trim() || '';
    const query = comuna && !dir.toLowerCase().includes(comuna.toLowerCase()) ? `${dir}, ${comuna}, Chile` : `${dir}, Chile`;
    this.geocoder.geocode({ address: query }, (r: any, s: string) => {
      if (s === 'OK' && r?.[0]) {
        const loc = r[0].geometry.location;
        this.setMarker(loc.lat(), loc.lng());
        this.map.panTo(loc);
        this.map.setZoom(17);
      }
    });
  }

  private setMarker(lat: number, lng: number): void {
    this.lat = lat; this.lng = lng;
    if (this.marker) {
      this.marker.setPosition({ lat, lng });
    } else {
      this.marker = new google.maps.Marker({ position: { lat, lng }, map: this.map, draggable: true });
      this.marker.addListener('dragend', (e: any) => this.setMarker(e.latLng.lat(), e.latLng.lng()));
    }
    this.picked.emit({ lat, lng });
  }

  limpiar(): void {
    this.lat = null; this.lng = null;
    if (this.marker) { this.marker.setMap(null); this.marker = null; }
    this.picked.emit({ lat: null, lng: null });
  }
}
