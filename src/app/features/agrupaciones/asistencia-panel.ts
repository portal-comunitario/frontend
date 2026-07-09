import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { EventoService } from '../../community/evento.service';
import { Evento } from '../../community/evento.models';
import { AsistenciaService } from '../../community/asistencia.service';
import { AsistenciaSocio } from '../../community/asistencia.models';

@Component({
  selector: 'app-asistencia-panel',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<div class="asis">
  @if (loading()) {
    <p class="msg-muted" style="font-size:.82rem">Cargando actividades…</p>
  } @else if (actividades().length === 0) {
    <p class="msg-muted" style="font-size:.82rem">Esta agrupación aún no tiene actividades registradas.</p>
  } @else {
    @for (a of actividades(); track a.id) {
      <div class="act">
        <div class="act-head">
          <div>
            <span class="act-titulo">{{ a.titulo }}</span>
            <span class="act-fecha">{{ a.fechaInicio | date:'EEE dd/MM/yyyy HH:mm' }}</span>
          </div>
          @if (isAdmin()) {
            <button class="btn-lista" (click)="abrir(a.id)">
              {{ abierto() === a.id ? 'Cerrar' : 'Pasar lista' }}
            </button>
          } @else {
            <span class="mi-estado" [class.presente]="miEstado(a.id) === true" [class.ausente]="miEstado(a.id) === false">
              {{ miEstado(a.id) === true ? 'Presente' : (miEstado(a.id) === false ? 'Ausente' : 'Sin registrar') }}
            </span>
          }
        </div>

        @if (isAdmin() && abierto() === a.id) {
          @if (rosterLoading()) {
            <p class="msg-muted" style="font-size:.8rem">Cargando socios…</p>
          } @else if (roster().length === 0) {
            <p class="msg-muted" style="font-size:.8rem">No hay socios inscritos en esta agrupación.</p>
          } @else {
            <div class="roster">
              @for (s of roster(); track s.email) {
                <label class="soc">
                  <input type="checkbox" [(ngModel)]="s.presente" />
                  <span>{{ s.email }}</span>
                </label>
              }
              <div class="roster-actions">
                <span class="roster-count">{{ presentesCount() }} de {{ roster().length }} presentes</span>
                <button class="btn-primary" [disabled]="saving()" (click)="guardar(a.id)">Guardar lista</button>
              </div>
            </div>
          }
        }
      </div>
    }
  }
</div>
  `,
  styles: [`
    .asis { border-top: 1px solid #f3f4f6; padding-top: 0.75rem; margin-top: 0.5rem; }
    .act { padding: 6px 0; border-bottom: 1px solid #f9fafb; }
    .act-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .act-titulo { font-size: 0.84rem; font-weight: 700; color: #1f2937; }
    .act-fecha { font-size: 0.74rem; color: #9ca3af; margin-left: 8px; }
    .btn-lista { background: #eef2ff; color: #3730a3; border: none; border-radius: 5px; padding: 3px 10px; font-size: 0.76rem; cursor: pointer; }
    .btn-lista:hover { background: #e0e7ff; }
    .mi-estado { font-size: 0.72rem; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: #f3f4f6; color: #6b7280; }
    .mi-estado.presente { background: #ecfdf5; color: #047857; }
    .mi-estado.ausente { background: #fee2e2; color: #b91c1c; }
    .roster { margin: 6px 0 4px; padding: 8px 10px; background: #f9fafb; border-radius: 6px; }
    .soc { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #374151; padding: 2px 0; cursor: pointer; }
    .roster-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
    .roster-count { font-size: 0.74rem; color: #6b7280; }
  `],
})
export class AsistenciaPanel implements OnInit {
  @Input({ required: true }) agrupacionId!: string;

  private readonly auth = inject(AuthService);
  private readonly eventos = inject(EventoService);
  private readonly svc = inject(AsistenciaService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  actividades = signal<Evento[]>([]);
  loading = signal(true);
  abierto = signal<string | null>(null);
  roster = signal<AsistenciaSocio[]>([]);
  rosterLoading = signal(false);
  saving = signal(false);
  private mia = signal<Map<string, boolean>>(new Map());

  ngOnInit(): void { this.cargar(); }

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

  /** true=presente, false=ausente, null=sin registrar. */
  miEstado(eventoId: string): boolean | null {
    return this.mia().has(eventoId) ? this.mia().get(eventoId)! : null;
  }

  presentesCount(): number {
    return this.roster().filter((s) => s.presente).length;
  }

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
}
