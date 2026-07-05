import {
  AfterViewChecked, Component, ElementRef, OnInit, ViewChild, inject, signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { AvisoService } from '../../community/aviso.service';
import { Aviso, AvisoRequest } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS, AVISO_FILTROS } from '../../community/aviso.ui';
import { MapsLoader } from '../../core/maps-loader';

declare const google: any;

/** Sección Tablón Vecinal — marketplace (dominio B). Publican vecinos, con moderación. */
@Component({
  selector: 'app-tablon',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
<section class="hero hero-tablon">
  <div class="hero-inner">
    <h1>Tablón Vecinal</h1>
    <p>Servicios, compra y venta, arriendos y objetos perdidos entre vecinos. Tu publicación pasa por revisión antes de aparecer.</p>
    <button class="btn-hero" (click)="toggleForm()">{{ showForm() ? '✕ Cancelar' : '+ Nueva publicación' }}</button>
  </div>
</section>

<div class="content-area">
  @if (showForm()) {
    <div class="form-panel">
      <h3>Nueva publicación</h3>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-row">
          <div class="field">
            <label>Título *</label>
            <input name="titulo" [(ngModel)]="form.titulo" required placeholder="Ej: Vendo bicicleta aro 26" />
          </div>
          <div class="field field-sm">
            <label>Categoría</label>
            <select name="categoria" [(ngModel)]="form.categoria">
              <option value="SERVICIO">Servicio vecinal</option>
              <option value="COMPRA_VENTA">Compra y Venta</option>
              <option value="ARRIENDO">Arriendo</option>
              <option value="PERDIDO_ENCONTRADO">Perdido / Encontrado</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Descripción *</label>
          <textarea name="descripcion" [(ngModel)]="form.descripcion" required rows="3"
                    placeholder="Detalle de tu publicación…"></textarea>
        </div>
        <div class="form-row">
          <div class="field field-sm">
            <label>Precio <span class="opt">(opcional, CLP)</span></label>
            <input name="precio" type="number" min="0" [(ngModel)]="form.precio" placeholder="50000" />
          </div>
          <div class="field">
            <label>Contacto <span class="opt">(opcional)</span></label>
            <input name="contacto" [(ngModel)]="form.contacto" placeholder="Ej: +56 9 1234 5678" />
          </div>
        </div>
        <div class="field">
          <label>Ubicación en el mapa <span class="opt">(opcional — aparecerá como pin)</span></label>
          <div class="location-row">
            <input #direccionInput name="busqueda" [(ngModel)]="busquedaDireccion"
                   placeholder="Escribe la dirección y elige de la lista" (keyup.enter)="geocodificar()" />
            <button type="button" class="btn-secondary" (click)="geocodificar()" [disabled]="geocodificando()">
              {{ geocodificando() ? '…' : '🔍 Buscar' }}
            </button>
            <button type="button" class="btn-secondary" (click)="usarMiUbicacion()">📍 GPS</button>
          </div>
          @if (geocodificandoError()) { <p class="msg-error">Dirección no encontrada. Agrega más detalles.</p> }
          @if (form.latitud) { <p class="msg-ok">✔ Ubicación definida — puedes ajustar el pin arrastrándolo</p> }
        </div>
        <div #miniMapContainer class="mini-map" [class.visible]="!!form.latitud"></div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="showForm.set(false)">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">
            {{ saving() ? 'Publicando…' : 'Publicar' }}
          </button>
        </div>
      </form>
    </div>
  }

  <div class="filter-row">
    @for (f of filtros; track f.value) {
      <button class="filter-pill" [class.active]="filtroActivo()===f.value" (click)="filtroActivo.set(f.value)">
        {{ f.label }}
      </button>
    }
  </div>

  @if (loading()) {
    <p class="msg-muted">Cargando publicaciones…</p>
  } @else if (avisosFiltrados().length === 0) {
    <p class="msg-muted">No hay publicaciones en esta categoría.</p>
  } @else {
    <div class="cards-grid">
      @for (a of avisosFiltrados(); track a.id) {
        <article class="news-card">
          <div class="news-card-band" [style.background]="AVISO_COLORS[a.categoria] ?? '#6366f1'">
            <span class="news-card-tipo">{{ AVISO_LABELS[a.categoria] ?? a.categoria }}</span>
            @if (a.resuelto) { <span class="badge-resuelto">Resuelto</span> }
            @else if (a.estado === 'PENDIENTE') { <span class="badge-pendiente">En revisión</span> }
            @else if (a.estado === 'RECHAZADO') { <span class="badge-rechazado">Rechazado</span> }
          </div>
          <div class="news-card-body">
            <h3>{{ a.titulo }}</h3>
            <p>{{ a.descripcion }}</p>
            @if (a.precio != null) { <p class="card-precio">$ {{ a.precio | number:'1.0-0' }}</p> }
            @if (a.contacto) { <p class="card-dir">📞 {{ a.contacto }}</p> }
            @if (a.direccion) { <p class="card-dir">📍 {{ a.direccion }}</p> }
          </div>
          <div class="news-card-footer">
            <span class="card-meta">{{ a.createdAt | date:'dd/MM/yyyy' }}</span>
            <div class="card-actions">
              @if (puedeGestionar(a) && !a.resuelto) {
                <button class="btn-resolver" (click)="marcarResuelto(a.id)">✓ Resuelto</button>
              }
              @if (puedeGestionar(a)) { <button class="btn-delete" (click)="delete(a.id)">✕</button> }
            </div>
          </div>
        </article>
      }
    </div>
  }
</div>
  `,
})
export class Tablon implements OnInit, AfterViewChecked {
  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('direccionInput') direccionInput!: ElementRef<HTMLInputElement>;

  private readonly svc = inject(AvisoService);
  private readonly auth = inject(AuthService);
  private readonly loader = inject(MapsLoader);

  protected readonly AVISO_COLORS = AVISO_COLORS;
  protected readonly AVISO_LABELS = AVISO_LABELS;
  protected readonly filtros = AVISO_FILTROS;

  avisos = signal<Aviso[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  filtroActivo = signal<'TODOS' | Aviso['categoria']>('TODOS');
  form: AvisoRequest = this.emptyForm();

  busquedaDireccion = '';
  geocodificando = signal(false);
  geocodificandoError = signal(false);
  private miniMap: any = null;
  private miniMarker: any = null;
  private miniMapReady = false;
  private autocompleteReady = false;

  avisosFiltrados = () => {
    const f = this.filtroActivo();
    return f === 'TODOS' ? this.avisos() : this.avisos().filter((a) => a.categoria === f);
  };

  ngOnInit(): void {
    this.load();
    this.loader.load().catch((e) => console.error('Google Maps no disponible', e));
  }

  ngAfterViewChecked(): void {
    if (this.showForm() && this.direccionInput && !this.autocompleteReady) {
      this.initAutocomplete();
    }
    if (this.showForm() && this.miniMapContainer && !!this.form.latitud && !this.miniMapReady) {
      this.initMiniMap();
    }
  }

  private emptyForm(): AvisoRequest {
    return { titulo: '', descripcion: '', categoria: 'SERVICIO', latitud: null, longitud: null, direccion: null, precio: null, contacto: null };
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (d) => { this.avisos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) { this.resetMiniMap(); this.autocompleteReady = false; }
  }

  puedeGestionar(a: Aviso): boolean {
    const r = this.auth.role();
    if (r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN') return true;
    return a.authorEmail?.toLowerCase() === this.auth.user()?.email?.toLowerCase();
  }

  submit(): void {
    this.saving.set(true); this.error.set(null);
    this.svc.create(this.form).subscribe({
      next: (a) => {
        this.avisos.update((prev) => [a, ...prev]);
        this.form = this.emptyForm();
        this.busquedaDireccion = '';
        this.resetMiniMap();
        this.showForm.set(false); this.saving.set(false);
      },
      error: () => { this.error.set('Error al publicar. Intenta nuevamente.'); this.saving.set(false); },
    });
  }

  marcarResuelto(id: string): void {
    this.svc.marcarResuelto(id).subscribe({ next: (u) => this.avisos.update((p) => p.map((x) => x.id === id ? u : x)) });
  }

  delete(id: string): void {
    this.svc.delete(id).subscribe({ next: () => this.avisos.update((p) => p.filter((x) => x.id !== id)) });
  }

  /** Places Autocomplete sobre el input de dirección (restringido a Chile). */
  private initAutocomplete(): void {
    const w = window as any;
    if (!w.google?.maps?.places || !this.direccionInput?.nativeElement) return;
    this.autocompleteReady = true;
    const ac = new google.maps.places.Autocomplete(this.direccionInput.nativeElement, {
      componentRestrictions: { country: 'cl' },
      fields: ['geometry', 'formatted_address'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const loc = place.geometry.location;
      this.busquedaDireccion = place.formatted_address ?? this.busquedaDireccion;
      this.setUbicacion(loc.lat(), loc.lng(), this.busquedaDireccion);
    });
  }

  async geocodificar(): Promise<void> {
    if (!this.busquedaDireccion.trim()) return;
    this.geocodificando.set(true); this.geocodificandoError.set(false);
    try {
      await this.loader.load();
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: this.busquedaDireccion, componentRestrictions: { country: 'CL' } },
        (results: any, status: string) => {
          if (status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            this.setUbicacion(loc.lat(), loc.lng(), results[0].formatted_address ?? this.busquedaDireccion);
          } else {
            this.geocodificandoError.set(true);
          }
          this.geocodificando.set(false);
        }
      );
    } catch {
      this.geocodificandoError.set(true);
      this.geocodificando.set(false);
    }
  }

  usarMiUbicacion(): void {
    navigator.geolocation?.getCurrentPosition((p) => {
      this.setUbicacion(p.coords.latitude, p.coords.longitude, this.busquedaDireccion || 'Mi ubicación');
    });
  }

  private setUbicacion(lat: number, lng: number, direccion: string): void {
    this.form = { ...this.form, latitud: lat, longitud: lng, direccion };
    this.miniMapReady = false;
    setTimeout(() => this.initMiniMap(), 50);
  }

  private initMiniMap(): void {
    const w = window as any;
    if (!w.google?.maps || !this.miniMapContainer?.nativeElement || this.form.latitud == null || this.form.longitud == null) return;
    this.miniMapReady = true;
    const pos = { lat: this.form.latitud, lng: this.form.longitud };
    if (this.miniMap) {
      this.miniMap.setCenter(pos);
      this.miniMarker?.setPosition(pos);
      return;
    }
    this.miniMap = new google.maps.Map(this.miniMapContainer.nativeElement, {
      center: pos, zoom: 16, mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    this.miniMarker = new google.maps.Marker({ position: pos, map: this.miniMap, draggable: true });
    this.miniMarker.addListener('dragend', (e: any) => {
      this.form = { ...this.form, latitud: e.latLng.lat(), longitud: e.latLng.lng() };
    });
    this.miniMap.addListener('click', (e: any) => {
      this.miniMarker.setPosition(e.latLng);
      this.form = { ...this.form, latitud: e.latLng.lat(), longitud: e.latLng.lng() };
    });
  }

  private resetMiniMap(): void {
    this.miniMap = null; this.miniMarker = null; this.miniMapReady = false;
  }
}
