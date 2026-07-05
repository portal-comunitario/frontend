import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { ComunicadoService } from '../../community/comunicado.service';
import { EventoService } from '../../community/evento.service';
import { Comunicado, ComunicadoRequest } from '../../community/comunicado.models';
import { Evento } from '../../community/evento.models';

const CAT_COLORS: Record<string, string> = { NOTICIA: '#3b82f6', AVISO: '#f59e0b', URGENTE: '#dc2626' };
const CAT_LABELS: Record<string, string> = { NOTICIA: 'Noticia', AVISO: 'Aviso', URGENTE: 'Urgente' };

/** Sección Inicio — Comunicados oficiales (dominio A) + próximos eventos destacados. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<section class="hero">
  <div class="hero-inner">
    <h1>Comunicados de la Comunidad</h1>
    <p>Noticias y avisos oficiales de la directiva. Mantente al día con lo que pasa en el barrio.</p>
    @if (isAdmin()) {
      <button class="btn-hero" (click)="toggleForm()">{{ showForm() ? '✕ Cancelar' : '+ Nuevo comunicado' }}</button>
    }
  </div>
</section>

<div class="content-area">
  @if (isAdmin() && showForm()) {
    <div class="form-panel">
      <h3>Nuevo comunicado</h3>
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="form-row">
          <div class="field">
            <label>Título *</label>
            <input name="titulo" [(ngModel)]="form.titulo" required placeholder="Ej: Corte de agua programado" />
          </div>
          <div class="field field-sm">
            <label>Categoría</label>
            <select name="categoria" [(ngModel)]="form.categoria">
              <option value="NOTICIA">Noticia</option>
              <option value="AVISO">Aviso</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Contenido *</label>
          <textarea name="contenido" [(ngModel)]="form.contenido" required rows="4"
                    placeholder="Detalle del comunicado…"></textarea>
        </div>
        <div class="field">
          <label>Imagen (URL) <span class="opt">opcional</span></label>
          <input name="imagenUrl" [(ngModel)]="form.imagenUrl" placeholder="https://…" />
        </div>
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

  @if (proximosEventos().length > 0) {
    <h2 class="section-title">Próximos eventos</h2>
    <div class="destacados">
      @for (ev of proximosEventos(); track ev.id) {
        <div class="destacado-card">
          <div class="fecha">📅 {{ ev.fechaInicio | date:'dd/MM HH:mm' }}</div>
          <div class="titulo">{{ ev.titulo }}</div>
        </div>
      }
    </div>
  }

  <h2 class="section-title">Comunicados</h2>
  @if (loading()) {
    <p class="msg-muted">Cargando comunicados…</p>
  } @else if (comunicados().length === 0) {
    <p class="msg-muted">Aún no hay comunicados publicados.</p>
  } @else {
    <div class="cards-grid">
      @for (c of comunicados(); track c.id) {
        <article class="news-card">
          <div class="news-card-band" [style.background]="CAT_COLORS[c.categoria] ?? '#6366f1'">
            <span class="news-card-tipo">{{ CAT_LABELS[c.categoria] ?? c.categoria }}</span>
          </div>
          <div class="news-card-body">
            <h3>{{ c.titulo }}</h3>
            <p>{{ c.contenido }}</p>
          </div>
          <div class="news-card-footer">
            <span class="card-meta">{{ c.createdAt | date:'dd/MM/yyyy' }}</span>
            @if (isAdmin()) { <button class="btn-delete" (click)="delete(c.id)">✕</button> }
          </div>
        </article>
      }
    </div>
  }
</div>
  `,
})
export class Inicio implements OnInit {
  private readonly svc = inject(ComunicadoService);
  private readonly eventoSvc = inject(EventoService);
  private readonly auth = inject(AuthService);

  protected readonly CAT_COLORS = CAT_COLORS;
  protected readonly CAT_LABELS = CAT_LABELS;
  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  comunicados = signal<Comunicado[]>([]);
  proximosEventos = signal<Evento[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);
  form: ComunicadoRequest = { titulo: '', contenido: '', categoria: 'NOTICIA', imagenUrl: null };

  ngOnInit(): void {
    this.load();
    this.eventoSvc.getAll().subscribe({
      next: (evs) => {
        const ahora = Date.now();
        this.proximosEventos.set(
          evs.filter((e) => new Date(e.fechaInicio).getTime() >= ahora).slice(0, 5)
        );
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (d) => { this.comunicados.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void { this.showForm.update((v) => !v); }

  submit(): void {
    this.saving.set(true); this.error.set(null);
    this.svc.create(this.form).subscribe({
      next: (c) => {
        this.comunicados.update((prev) => [c, ...prev]);
        this.form = { titulo: '', contenido: '', categoria: 'NOTICIA', imagenUrl: null };
        this.showForm.set(false); this.saving.set(false);
      },
      error: () => { this.error.set('Error al publicar. Intenta nuevamente.'); this.saving.set(false); },
    });
  }

  delete(id: string): void {
    this.svc.delete(id).subscribe({ next: () => this.comunicados.update((p) => p.filter((x) => x.id !== id)) });
  }
}
