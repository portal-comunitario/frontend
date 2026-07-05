import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { EventoService } from '../../community/evento.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { Evento, EventoRequest } from '../../community/evento.models';

const CAT_LABELS: Record<string, string> = {
  GENERAL: 'General', CLUB_ADULTO_MAYOR: 'Club Adulto Mayor',
  CENTRO_DE_MADRES: 'Centro de Madres', TALLER: 'Taller', REUNION: 'Reunión',
};

/** Sección Eventos — actividades con fecha (dominio C). Crea/borra solo dirigentes. */
@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<section class="hero hero-eventos">
  <div class="hero-inner">
    <h1>Eventos y Actividades</h1>
    <p>Talleres, reuniones y actividades de la comunidad.</p>
    @if (isAdmin()) {
      <button class="btn-hero" (click)="showForm.set(!showForm())">{{ showForm() ? '✕ Cancelar' : '+ Nuevo evento' }}</button>
    }
  </div>
</section>
<div class="content-area">
  @if (isAdmin() && showForm()) {
    <div class="form-panel">
      <h3>Nuevo evento</h3>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-row">
          <div class="field">
            <label>Título *</label>
            <input name="titulo" [(ngModel)]="form.titulo" required placeholder="Ej: Taller de zumba" />
          </div>
          <div class="field field-sm">
            <label>Categoría</label>
            <select name="categoria" [(ngModel)]="form.categoria">
              <option value="GENERAL">General</option>
              <option value="CLUB_ADULTO_MAYOR">Club Adulto Mayor</option>
              <option value="CENTRO_DE_MADRES">Centro de Madres</option>
              <option value="TALLER">Taller</option>
              <option value="REUNION">Reunión</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Descripción</label>
          <textarea name="descripcion" [(ngModel)]="form.descripcion" rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="field">
            <label>Fecha inicio *</label>
            <input name="fi" type="datetime-local" [(ngModel)]="fechaInicioStr" required />
          </div>
          <div class="field">
            <label>Fecha fin</label>
            <input name="ff" type="datetime-local" [(ngModel)]="fechaFinStr" />
          </div>
        </div>
        <div class="field">
          <label>Ubicación</label>
          <input name="ubicacion" [(ngModel)]="form.ubicacion" placeholder="Ej: Sede vecinal" />
        </div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="showForm.set(false)">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">
            {{ saving() ? 'Guardando…' : 'Crear evento' }}
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
          <div class="news-card-band" style="background:#10b981">
            <span class="news-card-tipo">{{ CAT_LABELS[ev.categoria] ?? ev.categoria }}</span>
          </div>
          <div class="news-card-body">
            <h3>{{ ev.titulo }}</h3>
            @if (ev.descripcion) { <p>{{ ev.descripcion }}</p> }
            @if (ev.agrupacionId && agrupacionNombre()[ev.agrupacionId]) {
              <span class="tag-agrupacion">👥 {{ agrupacionNombre()[ev.agrupacionId] }}</span>
            }
            <div class="event-meta">
              <span>📅 {{ ev.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</span>
              @if (ev.fechaFin) { <span>→ {{ ev.fechaFin | date:'HH:mm' }}</span> }
              @if (ev.ubicacion) { <span>📍 {{ ev.ubicacion }}</span> }
            </div>
          </div>
          <div class="news-card-footer">
            <span class="card-meta">{{ ev.authorEmail }}</span>
            @if (isAdmin()) { <button class="btn-delete" (click)="delete(ev.id)">✕</button> }
          </div>
        </article>
      }
    </div>
  }
</div>
  `,
})
export class Eventos implements OnInit {
  private readonly svc = inject(EventoService);
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly auth = inject(AuthService);

  protected readonly CAT_LABELS = CAT_LABELS;
  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  eventos = signal<Evento[]>([]);
  agrupacionNombre = signal<Record<string, string>>({});
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  form: EventoRequest = this.emptyForm();
  fechaInicioStr = '';
  fechaFinStr = '';

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
    return { titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null, categoria: 'GENERAL' };
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
    this.svc.create({ ...this.form, fechaInicio: this.fechaInicioStr, fechaFin: this.fechaFinStr || null }).subscribe({
      next: (ev) => {
        this.eventos.update((p) => [ev, ...p]);
        this.form = this.emptyForm(); this.fechaInicioStr = ''; this.fechaFinStr = '';
        this.showForm.set(false); this.saving.set(false);
      },
      error: () => { this.error.set('Error al crear el evento.'); this.saving.set(false); },
    });
  }

  delete(id: string): void {
    this.svc.delete(id).subscribe({ next: () => this.eventos.update((p) => p.filter((e) => e.id !== id)) });
  }
}
