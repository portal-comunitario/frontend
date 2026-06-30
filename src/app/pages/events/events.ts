import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CommunityService } from '../../community/community.service';
import { Event, EventRequest } from '../../community/community.models';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="container">
      <nav class="breadcrumb">
        <a routerLink="/dashboard">← Volver al inicio</a>
      </nav>

      <h1>Eventos</h1>

      <!-- Formulario nuevo evento -->
      <section class="card form-card">
        <h2>Nuevo evento</h2>
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label for="titulo">Título *</label>
            <input id="titulo" name="titulo" [(ngModel)]="form.titulo"
                   required maxlength="255" placeholder="Ej: Feria del barrio" />
          </div>
          <div class="field">
            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" name="descripcion" [(ngModel)]="form.descripcion"
                      rows="3" placeholder="Detalles del evento..."></textarea>
          </div>
          <div class="row">
            <div class="field">
              <label for="fechaInicio">Fecha inicio *</label>
              <input id="fechaInicio" name="fechaInicio" type="datetime-local"
                     [(ngModel)]="fechaInicioStr" required />
            </div>
            <div class="field">
              <label for="fechaFin">Fecha fin</label>
              <input id="fechaFin" name="fechaFin" type="datetime-local"
                     [(ngModel)]="fechaFinStr" />
            </div>
          </div>
          <div class="field">
            <label for="ubicacion">Ubicación</label>
            <input id="ubicacion" name="ubicacion" [(ngModel)]="form.ubicacion"
                   placeholder="Ej: Plaza central" />
          </div>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button type="submit" [disabled]="saving() || !f.valid" class="btn-primary">
            {{ saving() ? 'Guardando…' : 'Crear evento' }}
          </button>
        </form>
      </section>

      <!-- Lista de eventos -->
      <section class="events-list">
        @if (loading()) {
          <p class="muted">Cargando eventos…</p>
        } @else if (events().length === 0) {
          <p class="muted">No hay eventos programados.</p>
        } @else {
          @for (event of events(); track event.id) {
            <article class="card event-card">
              <div class="event-header">
                <h3>{{ event.titulo }}</h3>
                <button class="btn-danger small" (click)="deleteEvent(event.id)">Eliminar</button>
              </div>
              @if (event.descripcion) {
                <p>{{ event.descripcion }}</p>
              }
              <div class="event-meta">
                <span>📅 {{ event.fechaInicio | date:'dd/MM/yyyy HH:mm' }}</span>
                @if (event.fechaFin) {
                  <span>→ {{ event.fechaFin | date:'dd/MM/yyyy HH:mm' }}</span>
                }
                @if (event.ubicacion) {
                  <span>📍 {{ event.ubicacion }}</span>
                }
              </div>
              <p class="muted small">{{ event.authorEmail }}</p>
            </article>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    .container { max-width: 700px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    .breadcrumb { margin-bottom: 1rem; }
    .breadcrumb a { color: #6366f1; text-decoration: none; font-size: 0.9rem; }
    h1 { margin-bottom: 1.5rem; }
    .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
    .form-card { margin-bottom: 2rem; }
    h2 { margin-top: 0; font-size: 1.1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.75rem; flex: 1; }
    .row { display: flex; gap: 1rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    input, textarea { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 10px; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
    textarea { resize: vertical; }
    .btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 0.95rem; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-danger { background: #ef4444; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; }
    .error { color: #dc2626; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .event-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .event-card h3 { margin: 0; }
    .event-card p { margin: 0.25rem 0; color: #374151; }
    .event-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem; color: #6b7280; }
    .muted { color: #9ca3af; }
    .small { font-size: 0.8rem; }
  `]
})
export class Events implements OnInit {
  private readonly svc = inject(CommunityService);

  events = signal<Event[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

  form: EventRequest = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null };
  fechaInicioStr = '';
  fechaFinStr = '';

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.loading.set(true);
    this.svc.getEvents().subscribe({
      next: (data) => { this.events.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  submit(): void {
    this.saving.set(true);
    this.error.set(null);
    const request: EventRequest = {
      ...this.form,
      fechaInicio: this.fechaInicioStr,
      fechaFin: this.fechaFinStr || null,
    };
    this.svc.createEvent(request).subscribe({
      next: (event) => {
        this.events.update(prev => [event, ...prev]);
        this.form = { titulo: '', descripcion: '', fechaInicio: '', fechaFin: null, ubicacion: null };
        this.fechaInicioStr = '';
        this.fechaFinStr = '';
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Error al crear el evento. Intenta nuevamente.');
        this.saving.set(false);
      }
    });
  }

  deleteEvent(id: string): void {
    this.svc.deleteEvent(id).subscribe({
      next: () => this.events.update(prev => prev.filter(e => e.id !== id)),
      error: () => {}
    });
  }
}
