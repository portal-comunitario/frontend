import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { AsistenciaService } from '../../community/asistencia.service';
import { AsistenciaSocio, SesionAsistencia } from '../../community/asistencia.models';

@Component({
  selector: 'app-asistencia-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%)">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a agrupaciones</button>
    <h1>Asistencia · {{ nombre() || 'Agrupación' }}</h1>
    <p>Asistencia a las reuniones de la agrupación. Verde = presente, rojo = ausente.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando reuniones…</p>
  } @else if (sesiones().length === 0) {
    <div class="empty-state"><span>📋</span><p>Esta agrupación no tiene reuniones registradas. Define un día de reunión para pasar lista.</p></div>
  } @else {

    @for (s of sesiones(); track s.sesionId) {
      <div class="act-block">
        <div class="act-cab">
          <div>
            <span class="act-titulo">Reunión</span>
            <span class="act-fecha">{{ s.fecha | date:'EEEE d MMM' }}@if (s.hora) { · {{ s.hora }} }</span>
          </div>
          @if (isAdmin()) {
            <button class="btn-lista" (click)="abrir(s.sesionId)">{{ abierto() === s.sesionId ? 'Cerrar' : 'Pasar lista' }}</button>
          } @else {
            <span class="mi-estado" [class.presente]="miEstado(s.sesionId) === true" [class.ausente]="miEstado(s.sesionId) === false">
              {{ miEstado(s.sesionId) === true ? 'Presente' : (miEstado(s.sesionId) === false ? 'Ausente' : 'Sin registrar') }}
            </span>
          }
        </div>

        @if (isAdmin() && abierto() === s.sesionId) {
          @if (rosterLoading()) {
            <p class="msg-muted" style="font-size:.82rem">Cargando socios…</p>
          } @else if (roster().length === 0) {
            <p class="msg-muted" style="font-size:.82rem">No hay socios inscritos en esta agrupación.</p>
          } @else {
            <div class="grid-socios">
              @for (soc of roster(); track soc.email) {
                <label class="soc-card" [class.on]="soc.presente">
                  <input type="checkbox" [(ngModel)]="soc.presente" />
                  <span class="soc-nombre">{{ nombreDe(soc.email) }}</span>
                  <span class="soc-flag">{{ soc.presente ? '✔ Presente' : 'Ausente' }}</span>
                </label>
              }
            </div>
            <div class="roster-actions">
              <span class="roster-count">{{ presentesCount() }} de {{ roster().length }} presentes</span>
              <button class="btn-primary" [disabled]="saving()" (click)="guardar(s.sesionId)">Guardar lista</button>
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
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly svc = inject(AsistenciaService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  agrupacionId = '';
  nombre = signal('');
  sesiones = signal<SesionAsistencia[]>([]);
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
    this.svc.sesiones(this.agrupacionId).subscribe({
      next: (s) => { this.sesiones.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    if (!this.isAdmin()) {
      this.svc.mia(this.agrupacionId).subscribe({
        next: (list) => this.mia.set(new Map(list.map((m) => [m.eventoId, m.presente]))),
      });
    }
  }

  nombreDe(email: string): string { return this.vecinoNombre()[email] ?? email; }

  miEstado(sesionId: string): boolean | null {
    return this.mia().has(sesionId) ? this.mia().get(sesionId)! : null;
  }

  presentesCount(): number { return this.roster().filter((s) => s.presente).length; }

  abrir(sesionId: string): void {
    if (this.abierto() === sesionId) { this.abierto.set(null); return; }
    this.abierto.set(sesionId);
    this.rosterLoading.set(true);
    this.svc.deSesion(this.agrupacionId, sesionId).subscribe({
      next: (r) => { this.roster.set(r); this.rosterLoading.set(false); },
      error: () => this.rosterLoading.set(false),
    });
  }

  guardar(sesionId: string): void {
    this.saving.set(true);
    const presentes = this.roster().filter((s) => s.presente).map((s) => s.email);
    this.svc.marcarSesion(this.agrupacionId, sesionId, presentes).subscribe({
      next: (r) => { this.roster.set(r); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  volver(): void { this.router.navigate(['/portal/agrupaciones']); }
}
