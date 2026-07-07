import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { EventoService } from '../../community/evento.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { Evento, EventoRequest } from '../../community/evento.models';
import { etiquetaRecurrencia } from '../../core/recurrence.util';
import { MapPicker } from './map-picker';

interface ColorPin { hex: string; label: string; }

/** Sección Eventos — actividades con fecha (dominio C). Crea/borra solo dirigentes. */
@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [FormsModule, DatePipe, MapPicker],
  template: `
<section class="hero hero-eventos">
  <div class="hero-inner">
    <h1>Eventos y Actividades</h1>
    <p>Talleres, reuniones y actividades de la comunidad.</p>
    @if (isAdmin()) {
      <button class="btn-hero" (click)="toggleForm()">{{ showForm() ? '✕ Cancelar' : '+ Nuevo evento' }}</button>
    }
  </div>
</section>
<div class="content-area">
  @if (isAdmin() && showForm()) {
    <div class="form-panel">
      <h3>{{ editingId() ? 'Editar evento' : 'Nuevo evento' }}</h3>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-row">
          <div class="field">
            <label>Título *</label>
            <input name="titulo" [(ngModel)]="form.titulo" required placeholder="Ej: Feria dominical" />
          </div>
          <div class="field field-sm">
            <label>Tipo <span class="opt">(opcional)</span></label>
            <input name="subcategoria" [(ngModel)]="form.subcategoria" placeholder="Ej: Feria, Deporte, Cultura" />
          </div>
        </div>
        <div class="field">
          <label>Color del pin en el mapa <span class="opt">(opcional)</span></label>
          <div class="color-picker">
            @for (c of coloresPin; track c.hex) {
              <button type="button" class="swatch" [class.sel]="(form.color ?? '') === c.hex"
                      [style.background]="c.hex || '#f59e0b'" [title]="c.label"
                      (click)="form.color = c.hex">
                @if ((form.color ?? '') === c.hex) { <span class="tick">✓</span> }
              </button>
            }
            <span class="color-nota">{{ colorLabel() }}</span>
          </div>
        </div>
        <div class="field">
          <label>Descripción</label>
          <textarea name="descripcion" [(ngModel)]="form.descripcion" rows="2"></textarea>
        </div>
        <div class="form-row fecha-row">
          <div class="field field-sm">
            <label>Fecha *</label>
            <input name="fecha" type="date" [(ngModel)]="fecha" required />
          </div>
          <div class="field field-sm">
            <label>Hora inicio *</label>
            <input name="hi" type="time" [(ngModel)]="horaInicio" required />
          </div>
          <div class="field field-sm">
            <label>Hora término <span class="opt">(opcional)</span></label>
            <input name="hf" type="time" [(ngModel)]="horaFin" />
          </div>
          <div class="field rec-field">
            <label class="spacer">&nbsp;</label>
            <label class="rec-check">
              <input type="checkbox" name="rec" [(ngModel)]="form.recurrente" />
              <span>Evento recurrente</span>
            </label>
          </div>
        </div>
        @if (form.recurrente) {
          <div class="form-row">
            <div class="field field-sm">
              <label>Se repite</label>
              <select name="frec" [(ngModel)]="form.frecuencia">
                <option value="DIARIA">Cada día</option>
                <option value="SEMANAL">Cada semana</option>
                <option value="MENSUAL">Cada mes</option>
                <option value="ANUAL">Cada año</option>
              </select>
            </div>
            <div class="field field-sm">
              <label>Cada</label>
              <input name="int" type="number" min="1" [(ngModel)]="form.intervalo" />
            </div>
            <div class="field">
              <label>Repetir hasta <span class="opt">(opcional)</span></label>
              <input name="recfin" type="date" [(ngModel)]="form.recurrenciaFin" />
            </div>
          </div>
          <p class="rec-nota">Se repetirá {{ frecuenciaLabel() }} a partir de la fecha elegida, en el mismo horario.</p>
        }
        <div class="field">
          <label>Ubicación</label>
          <div class="ubic-row">
            <input name="ubicacion" [(ngModel)]="form.ubicacion" placeholder="Ej: Av. Las Parcelas 123"
                   (keydown.enter)="$event.preventDefault(); buscarEnMapa()" />
            <button type="button" class="btn-buscar" (click)="buscarEnMapa()">🔍 Buscar en el mapa</button>
          </div>
        </div>
        <div class="field">
          <label>Punto en el mapa <span class="opt">(opcional — aparecerá en el Mapa comunitario)</span></label>
          <app-map-picker #picker [lat]="form.latitud ?? null" [lng]="form.longitud ?? null" (picked)="onPicked($event)" />
        </div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="cancelar()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">
            {{ saving() ? 'Guardando…' : (editingId() ? 'Guardar cambios' : 'Crear evento') }}
          </button>
        </div>
      </form>
    </div>
  }
  @if (loading()) { <p class="msg-muted">Cargando eventos…</p> }
  @else if (eventos().length === 0) { <p class="msg-muted">No hay eventos programados aún.</p> }
  @else {
    <div class="cards-grid">
      @for (ev of eventos(); track ev.id) {
        <article class="news-card">
          <div class="news-card-band" [style.background]="ev.color || '#f59e0b'">
            <span class="news-card-tipo">{{ ev.subcategoria || 'Evento' }}</span>
            @if (isAdmin()) {
              <div class="band-actions">
                <button class="band-btn" title="Editar" (click)="editar(ev)">✏️</button>
                <button class="band-btn" title="Eliminar" (click)="delete(ev.id)">✕</button>
              </div>
            }
          </div>
          <div class="news-card-body">
            <div class="ev-top">
              <h3>{{ ev.titulo }}</h3>
              @if (ev.descripcion) { <p class="ev-desc">{{ ev.descripcion }}</p> }
            </div>

            <div class="ev-detalles">
              <div class="ev-info">
                <div class="ev-row">
                  <span class="ev-ico">📅</span>
                  <span>{{ ev.fechaInicio | date:'dd/MM/yyyy HH:mm' }}@if (ev.fechaFin) {<span class="ev-dim"> – {{ ev.fechaFin | date:'HH:mm' }}</span>}</span>
                </div>
                @if (ev.ubicacion) {
                  <div class="ev-row"><span class="ev-ico">📍</span><span>{{ ev.ubicacion }}</span></div>
                }
                @if (ev.agrupacionId && agrupacionNombre()[ev.agrupacionId]) {
                  <div class="ev-row"><span class="ev-ico">👥</span><span>{{ agrupacionNombre()[ev.agrupacionId] }}</span></div>
                }
              </div>
              @if (ev.recurrente || ev.latitud != null) {
                <div class="ev-badges">
                  @if (ev.recurrente) { <span class="badge badge-rec">🔁 {{ etiqueta(ev) }}</span> }
                  @if (ev.latitud != null) { <span class="badge badge-mapa">🗺️ En el mapa</span> }
                </div>
              }
            </div>
          </div>
          <div class="news-card-footer">
            <span class="card-meta">Publicado por {{ ev.authorNombre || ev.authorEmail }}</span>
            @if (isAdmin() && !ev.agrupacionId) {
              @if (confirmandoNotif() === ev.id) {
                <span class="notif-confirm">
                  ¿Enviar a toda la comunidad?
                  <button class="btn-confirm" [disabled]="notificando()" (click)="confirmarNotificar(ev)">Sí</button>
                  <button class="btn-cancel" (click)="confirmandoNotif.set(null)">No</button>
                </span>
              } @else if (ev.notificadoComunidad) {
                <button class="btn-notif notificado" (click)="confirmandoNotif.set(ev.id)" title="Volver a notificar">✓ Notificado</button>
              } @else {
                <button class="btn-notif" (click)="confirmandoNotif.set(ev.id)">📣 Notificar</button>
              }
            }
          </div>
        </article>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .opt { font-weight: 400; color: #9ca3af; font-size: 0.8em; }
    .rec-field { display: flex; flex-direction: column; }
    .rec-field .spacer { visibility: hidden; }
    .rec-check { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; font-size: 0.78rem; color: #4b5563; cursor: pointer; white-space: nowrap; }
    .rec-check input { width: auto; margin: 0; }
    .rec-nota { font-size: 0.74rem; color: #6b7280; margin: 2px 0 0; }
    .ubic-row { display: flex; gap: 8px; }
    .ubic-row input { flex: 1; }
    .btn-buscar { white-space: nowrap; background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 6px; padding: 0 12px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .btn-buscar:hover { background: #e0e7ff; }
    .color-picker { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .swatch { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #e5e7eb; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
    .swatch.sel { border-color: #1f2937; }
    .swatch .tick { color: #fff; font-size: 0.8rem; font-weight: 700; text-shadow: 0 0 2px rgba(0,0,0,0.4); }
    .color-nota { font-size: 0.76rem; color: #6b7280; margin-left: 4px; }
    .btn-notif { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 6px; padding: 3px 10px; font-size: 0.76rem; font-weight: 600; cursor: pointer; }
    .btn-notif:hover { background: #dbeafe; }
    .btn-notif.notificado { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .notif-confirm { display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; color: #374151; }
    .btn-confirm { background: #dc2626; color: #fff; border: none; border-radius: 5px; padding: 3px 10px; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
    .btn-cancel { background: #fff; border: 1px solid #d1d5db; border-radius: 5px; padding: 3px 8px; font-size: 0.74rem; cursor: pointer; }
    .band-actions { margin-left: auto; display: flex; gap: 4px; }
    .band-btn { background: rgba(255,255,255,0.25); border: none; color: #fff; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .band-btn:hover { background: rgba(255,255,255,0.45); }
    .news-card-body { display: flex; flex-direction: column; }
    .ev-top { flex: 1 1 auto; }
    .ev-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0; }
    .ev-detalles { border-top: 1px solid #f3f4f6; margin-top: 0.75rem; padding-top: 0.7rem; }
    .ev-info { display: flex; flex-direction: column; gap: 5px; }
    .ev-row { display: flex; align-items: flex-start; gap: 7px; font-size: 0.8rem; color: #4b5563; }
    .ev-ico { width: 16px; flex-shrink: 0; text-align: center; }
    .ev-dim { color: #9ca3af; }
    .ev-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.6rem; }
    .badge { font-size: 0.72rem; font-weight: 600; padding: 2px 9px; border-radius: 999px; }
    .badge-rec { background: #f5f3ff; color: #7c3aed; }
    .badge-mapa { background: #f0fdfa; color: #0d9488; }
  `],
})
export class Eventos implements OnInit {
  private readonly svc = inject(EventoService);
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly auth = inject(AuthService);

  protected readonly coloresPin: ColorPin[] = [
    { hex: '', label: 'Estándar (ámbar)' },
    { hex: '#dc2626', label: 'Rojo' },
    { hex: '#f97316', label: 'Naranja' },
    { hex: '#16a34a', label: 'Verde' },
    { hex: '#2563eb', label: 'Azul' },
    { hex: '#7c3aed', label: 'Morado' },
  ];

  colorLabel(): string {
    return this.coloresPin.find((c) => c.hex === (this.form.color ?? ''))?.label ?? 'Estándar (ámbar)';
  }

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  eventos = signal<Evento[]>([]);
  agrupacionNombre = signal<Record<string, string>>({});
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);
  form: EventoRequest = this.emptyForm();
  fecha = '';
  horaInicio = '';
  horaFin = '';

  ngOnInit(): void {
    this.load();
    this.agrupacionSvc.getAll().subscribe({
      next: (list) => {
        const map: Record<string, string> = {};
        list.forEach((a) => (map[a.id] = a.nombre));
        this.agrupacionNombre.set(map);
      },
    });
  }

  private emptyForm(): EventoRequest {
    return {
      titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null,
      categoria: 'GENERAL', subcategoria: null, color: '',
      latitud: null, longitud: null, recurrente: false, frecuencia: 'SEMANAL', intervalo: 1, recurrenciaFin: null,
    };
  }

  @ViewChild('picker') picker?: MapPicker;

  confirmandoNotif = signal<string | null>(null);
  notificando = signal<string | null>(null);

  confirmarNotificar(ev: Evento): void {
    this.notificando.set(ev.id);
    this.svc.notificar(ev.id).subscribe({
      next: (actualizado) => {
        this.eventos.update((p) => p.map((e) => e.id === actualizado.id ? actualizado : e));
        this.confirmandoNotif.set(null);
        this.notificando.set(null);
      },
      error: () => { this.notificando.set(null); this.error.set('No se pudo enviar la notificación.'); },
    });
  }

  onPicked(p: { lat: number | null; lng: number | null }): void {
    this.form.latitud = p.lat;
    this.form.longitud = p.lng;
  }

  buscarEnMapa(): void {
    this.picker?.buscarDireccion(this.form.ubicacion ?? '');
  }

  toggleForm(): void {
    if (this.showForm()) { this.cancelar(); return; }
    this.editingId.set(null);
    this.form = this.emptyForm(); this.fecha = ''; this.horaInicio = ''; this.horaFin = '';
    this.showForm.set(true);
  }

  cancelar(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.emptyForm(); this.fecha = ''; this.horaInicio = ''; this.horaFin = '';
    this.error.set(null);
  }

  editar(ev: Evento): void {
    this.editingId.set(ev.id);
    const ini = new Date(ev.fechaInicio);
    const fin = ev.fechaFin ? new Date(ev.fechaFin) : null;
    const pad = (n: number) => String(n).padStart(2, '0');
    this.fecha = `${ini.getFullYear()}-${pad(ini.getMonth() + 1)}-${pad(ini.getDate())}`;
    this.horaInicio = `${pad(ini.getHours())}:${pad(ini.getMinutes())}`;
    this.horaFin = fin ? `${pad(fin.getHours())}:${pad(fin.getMinutes())}` : '';
    this.form = {
      titulo: ev.titulo, descripcion: ev.descripcion, fechaInicio: ev.fechaInicio, fechaFin: ev.fechaFin,
      ubicacion: ev.ubicacion, categoria: ev.categoria, subcategoria: ev.subcategoria, color: ev.color ?? '',
      agrupacionId: ev.agrupacionId, latitud: ev.latitud, longitud: ev.longitud,
      recurrente: ev.recurrente, frecuencia: ev.frecuencia ?? 'SEMANAL', intervalo: ev.intervalo ?? 1, recurrenciaFin: ev.recurrenciaFin,
    };
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  etiqueta(ev: Evento): string { return etiquetaRecurrencia(ev); }

  frecuenciaLabel(): string {
    const n = this.form.intervalo ?? 1;
    const f = this.form.frecuencia ?? 'SEMANAL';
    const unidad: Record<string, string> = { DIARIA: 'día', SEMANAL: 'semana', MENSUAL: 'mes', ANUAL: 'año' };
    const plural: Record<string, string> = { DIARIA: 'días', SEMANAL: 'semanas', MENSUAL: 'meses', ANUAL: 'años' };
    return n === 1 ? `cada ${unidad[f]}` : `cada ${n} ${plural[f]}`;
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (d) => { this.eventos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit(): void {
    this.saving.set(true); this.error.set(null);
    const rec = !!this.form.recurrente;
    const payload: EventoRequest = {
      ...this.form,
      fechaInicio: `${this.fecha}T${this.horaInicio}`,
      fechaFin: this.horaFin ? `${this.fecha}T${this.horaFin}` : null,
      recurrente: rec,
      frecuencia: rec ? (this.form.frecuencia || 'SEMANAL') : null,
      intervalo: rec ? (this.form.intervalo && this.form.intervalo > 0 ? this.form.intervalo : 1) : null,
      recurrenciaFin: rec ? (this.form.recurrenciaFin || null) : null,
    };
    const id = this.editingId();
    const done = () => {
      this.form = this.emptyForm(); this.fecha = ''; this.horaInicio = ''; this.horaFin = '';
      this.showForm.set(false); this.editingId.set(null); this.saving.set(false);
    };
    if (id) {
      this.svc.update(id, payload).subscribe({
        next: (ev) => { this.eventos.update((p) => p.map((e) => e.id === ev.id ? ev : e)); done(); },
        error: () => { this.error.set('Error al guardar los cambios.'); this.saving.set(false); },
      });
    } else {
      this.svc.create(payload).subscribe({
        next: (ev) => { this.eventos.update((p) => [ev, ...p]); done(); },
        error: () => { this.error.set('Error al crear el evento.'); this.saving.set(false); },
      });
    }
  }

  delete(id: string): void {
    this.svc.delete(id).subscribe({ next: () => this.eventos.update((p) => p.filter((e) => e.id !== id)) });
  }
}
