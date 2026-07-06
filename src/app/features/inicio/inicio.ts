import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
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
      <h3>{{ editingId() ? 'Editar comunicado' : 'Nuevo comunicado' }}</h3>
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
          <button type="button" class="btn-ghost" (click)="cancelar()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">
            {{ saving() ? 'Guardando…' : (editingId() ? 'Guardar cambios' : 'Publicar') }}
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
          <div class="fecha">📅 {{ fechaLarga(ev.fechaInicio) }}</div>
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
            @if (isAdmin()) {
              <div class="band-actions">
                <button class="band-btn" title="Editar" (click)="editar(c)">✏️</button>
                <button class="band-btn" title="Eliminar" (click)="delete(c.id)">✕</button>
              </div>
            }
          </div>
          <div class="news-card-body">
            <h3>{{ c.titulo }}</h3>
            <p>{{ c.contenido }}</p>
          </div>
          <div class="news-card-footer">
            <span class="card-meta">{{ c.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>
        </article>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .band-actions { margin-left: auto; display: flex; gap: 4px; }
    .band-btn { background: rgba(255,255,255,0.25); border: none; color: #fff; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .band-btn:hover { background: rgba(255,255,255,0.45); }
    .news-card-body p { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  `],
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

  /** Fecha en texto: "Domingo 12, Julio 10:00 AM". */
  fechaLarga(iso: string): string {
    const d = new Date(iso);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const dia = cap(formatDate(d, 'EEEE', 'es-CL'));
    const num = formatDate(d, 'd', 'es-CL');
    const mes = cap(formatDate(d, 'MMMM', 'es-CL'));
    const hora = formatDate(d, 'h:mm', 'es-CL');
    const ampm = d.getHours() < 12 ? 'AM' : 'PM';
    return `${dia} ${num}, ${mes} ${hora} ${ampm}`;
  }
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  error = signal<string | null>(null);
  form: ComunicadoRequest = this.emptyForm();

  private emptyForm(): ComunicadoRequest {
    return { titulo: '', contenido: '', categoria: 'NOTICIA', imagenUrl: null };
  }

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

  toggleForm(): void {
    if (this.showForm()) { this.cancelar(); return; }
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  cancelar(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.error.set(null);
  }

  editar(c: Comunicado): void {
    this.editingId.set(c.id);
    this.form = { titulo: c.titulo, contenido: c.contenido, categoria: c.categoria, imagenUrl: c.imagenUrl ?? null };
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submit(): void {
    this.saving.set(true); this.error.set(null);
    const id = this.editingId();
    const done = () => { this.form = this.emptyForm(); this.showForm.set(false); this.editingId.set(null); this.saving.set(false); };
    if (id) {
      this.svc.update(id, this.form).subscribe({
        next: (c) => { this.comunicados.update((p) => p.map((x) => x.id === c.id ? c : x)); done(); },
        error: () => { this.error.set('Error al guardar los cambios.'); this.saving.set(false); },
      });
    } else {
      this.svc.create(this.form).subscribe({
        next: (c) => { this.comunicados.update((prev) => [c, ...prev]); done(); },
        error: () => { this.error.set('Error al publicar. Intenta nuevamente.'); this.saving.set(false); },
      });
    }
  }

  delete(id: string): void {
    this.svc.delete(id).subscribe({ next: () => this.comunicados.update((p) => p.filter((x) => x.id !== id)) });
  }
}
