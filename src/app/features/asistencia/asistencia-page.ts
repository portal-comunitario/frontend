import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { EventoService } from '../../community/evento.service';
import { Evento } from '../../community/evento.models';
import { AgrupacionService } from '../../community/agrupacion.service';
import { AsistenciaService } from '../../community/asistencia.service';
import { AsistenciaSocio } from '../../community/asistencia.models';

/** Página dedicada de asistencia de una agrupación: pasar lista por actividad / ver la propia. */
@Component({
  selector: 'app-asistencia-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%)">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a agrupaciones</button>
    <h1>Asistencia · {{ nombre() || 'Agrupación' }}</h1>
    <p>Asistencia a las actividades de la agrupación. Verde = presente, rojo = ausente.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando actividades…</p>
  } @else if (actividades().length === 0) {
    <div class="empty-state"><span>📋</span><p>Esta agrupación aún no tiene actividades registradas.</p></div>
  } @else {

    @for (a of actividades(); track a.id) {
      <div class="act-block">
        <div class="act-cab">
          <div>
            <span class="act-titulo">{{ a.titulo }}</span>
            <span class="act-fecha">{{ a.fechaInicio | date:'EEEE d MMM, HH:mm' }}</span>
          </div>
          @if (isAdmin()) {
            <button class="btn-lista" (click)="abrir(a.id)">{{ abierto() === a.id ? 'Cerrar' : 'Pasar lista' }}</button>
          } @else {
            <span class="mi-estado" [class.presente]="miEstado(a.id) === true" [class.ausente]="miEstado(a.id) === false">
              {{ miEstado(a.id) === true ? 'Presente' : (miEstado(a.id) === false ? 'Ausente' : 'Sin registrar') }}
            </span>
          }
        </div>

        @if (isAdmin() && abierto() === a.id) {
          @if (rosterLoading()) {
            <p class="msg-muted" style="font-size:.82rem">Cargando socios…</p>
          } @else if (roster().length === 0) {
            <p class="msg-muted" style="font-size:.82rem">No hay socios inscritos en esta agrupación.</p>
          } @else {
            <div class="grid-socios">
              @for (s of roster(); track s.email) {
                <label class="soc-card" [class.on]="s.presente">
                  <input type="checkbox" [(ngModel)]="s.presente" />
                  <span class="soc-nombre">{{ nombreDe(s.email) }}</span>
                  <span class="soc-flag">{{ s.presente ? '✔ Presente' : 'Ausente' }}</span>
                </label>
              }
            </div>
            <div class="roster-actions">
              <span class="roster-count">{{ presentesCount() }} de {{ roster().length }} presentes</span>
              <button class="btn-primary" [disabled]="saving()" (click)="guardar(a.id)">Guardar lista</button>
            </div>
          }
        }
      </div>
    }
  }
</div>
  `,
  styles: [`
    .btn-volver { background: rgba(255,255,255,0.2); border: none; color: #fff; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; margin-bottom: 0.75rem; }
    .btn-volver:hover { background: rgba(255,255,255,0.32); }
    .act-block { background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .act-cab { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .act-titulo { font-weight: 700; color: #1f2937; }
    .act-fecha { font-size: 0.78rem; color: #9ca3af; margin-left: 10px; text-transform: capitalize; }
    .btn-lista { background: #0d9488; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-size: 0.8rem; cursor: pointer; }
    .btn-lista:hover { background: #0f766e; }
    .mi-estado { font-size: 0.76rem; font-weight: 700; padding: 3px 12px; border-radius: 999px; background: #f3f4f6; color: #6b7280; }
    .mi-estado.presente { background: #ecfdf5; color: #047857; }
    .mi-estado.ausente { background: #fee2e2; color: #b91c1c; }
    .grid-socios { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 12px 0; }
    .soc-card { display: flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb; border-left: 4px solid #d1d5db; border-radius: 8px; padding: 8px 10px; cursor: pointer; background: #fafafa; }
    .soc-card.on { border-left-color: #16a34a; background: #f0fdf4; }
    .soc-card input { width: auto; margin: 0; }
    .soc-nombre { flex: 1; font-size: 0.82rem; color: #374151; }
    .soc-flag { font-size: 0.72rem; font-weight: 700; color: #9ca3af; }
    .soc-card.on .soc-flag { color: #047857; }
    .roster-actions { display: flex; align-items: center; justify-content: space-between; }
    .roster-count { font-size: 0.8rem; color: #6b7280; }
  `],
})
export class AsistenciaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventos = inject(EventoService);
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly svc = inject(AsistenciaService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  agrupacionId = '';
  nombre = signal('');
  actividades = signal<Evento[]>([]);
  loading = signal(true);
  abierto = signal<string | null>(null);
  roster = signal<AsistenciaSocio[]>([]);
  rosterLoading = signal(false);
  saving = signal(false);
  vecinoNombre = signal<Record<string, string>>({});
  private mia = signal<Map<string, boolean>>(new Map());

  ngOnInit(): void {
    this.agrupacionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.agrupacionSvc.getAll().subscribe({
      next: (list) => { const a = list.find((x) => x.id === this.agrupacionId); if (a) this.nombre.set(a.nombre); },
    });
    if (this.isAdmin()) {
      this.auth.getVecinos().subscribe({
        next: (vs) => { const m: Record<string, string> = {}; vs.forEach((v) => { if (v.email) m[v.email] = v.name; }); this.vecinoNombre.set(m); },
      });
    }
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.eventos.getAll().subscribe({
      next: (evs) => {
        const propias = evs
          .filter((e) => e.agrupacionId === this.agrupacionId)
          .sort((a, b) => (a.fechaInicio < b.fechaInicio ? 1 : -1));
        this.actividades.set(propias);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    if (!this.isAdmin()) {
      this.svc.mia(this.agrupacionId).subscribe({
        next: (list) => this.mia.set(new Map(list.map((m) => [m.eventoId, m.presente]))),
      });
    }
  }

  nombreDe(email: string): string { return this.vecinoNombre()[email] ?? email; }

  miEstado(eventoId: string): boolean | null {
    return this.mia().has(eventoId) ? this.mia().get(eventoId)! : null;
  }

  presentesCount(): number { return this.roster().filter((s) => s.presente).length; }

  abrir(eventoId: string): void {
    if (this.abierto() === eventoId) { this.abierto.set(null); return; }
    this.abierto.set(eventoId);
    this.rosterLoading.set(true);
    this.svc.deActividad(eventoId).subscribe({
      next: (r) => { this.roster.set(r); this.rosterLoading.set(false); },
      error: () => this.rosterLoading.set(false),
    });
  }

  guardar(eventoId: string): void {
    this.saving.set(true);
    const presentes = this.roster().filter((s) => s.presente).map((s) => s.email);
    this.svc.marcar(eventoId, presentes).subscribe({
      next: (r) => { this.roster.set(r); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  volver(): void { this.router.navigate(['/portal/agrupaciones']); }
}
