import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { CuotaService } from '../../community/cuota.service';
import { Cuota, CuotaActivarRequest, CuotaPeriodo } from '../../community/cuota.models';

interface GrupoSocio { email: string; cuotas: Cuota[]; pendientes: number; }

/** Panel de cuotas de una agrupación (activar/cerrar/ver/pagar). */
@Component({
  selector: 'app-cuotas-panel',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
<div class="cuotas">
  @if (loading()) {
    <p class="msg-muted" style="font-size:.82rem">Cargando cuotas…</p>
  } @else {

    @if (periodo(); as p) {
      <div class="periodo-info">
        <strong>Cuotas activas</strong> · \${{ p.monto | number:'1.0-0' }} {{ p.periodicidad === 'SEMANAL' ? 'semanal' : 'mensual' }}
        · {{ p.fechaInicio | date:'dd/MM/yyyy' }} → {{ p.fechaFin | date:'dd/MM/yyyy' }}
        @if (isAdmin()) {
          <button class="btn-editar" (click)="abrirEditor(p.monto)">{{ editando() ? 'Cancelar' : '✎ Editar monto' }}</button>
          <button class="btn-cerrar" (click)="cerrar()">Cerrar período</button>
        }
      </div>
      @if (isAdmin() && editando()) {
        <div class="editar-monto">
          <label>Nuevo monto ($)</label>
          <input type="number" min="1" [(ngModel)]="montoEdit" />
          <button class="btn-primary" [disabled]="saving() || !montoEdit || montoEdit <= 0" (click)="guardarMonto()">Guardar</button>
          <span class="edit-nota">Solo cambia las cuotas aún no pagadas.</span>
        </div>
      }
    } @else if (isAdmin()) {
      <form class="activar-form" (ngSubmit)="activar()" #f="ngForm">
        <div class="af-title">Activar cuotas</div>
        <div class="af-row">
          <div class="field field-sm">
            <label>Monto ($)</label>
            <input name="monto" type="number" min="1" [(ngModel)]="form.monto" required />
          </div>
          <div class="field field-sm">
            <label>Periodicidad</label>
            <select name="per" [(ngModel)]="form.periodicidad">
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>
          <div class="field">
            <label>Desde</label>
            <input name="ini" type="date" [(ngModel)]="form.fechaInicio" required />
          </div>
          <div class="field">
            <label>Hasta</label>
            <input name="fin" type="date" [(ngModel)]="form.fechaFin" required />
          </div>
        </div>
        <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">Activar cuotas</button>
      </form>
    } @else {
      <p class="msg-muted" style="font-size:.82rem">Esta agrupación no tiene cuotas activas.</p>
    }

    @if (cuotas().length > 0) {
      @if (isAdmin()) {
        @for (g of grupos(); track g.email) {
          <div class="socio-cuotas">
            <div class="sc-head">{{ g.email }} <span class="sc-pend">{{ g.pendientes }} pendiente{{ g.pendientes === 1 ? '' : 's' }}</span></div>
            @for (c of g.cuotas; track c.id) {
              <div class="cuota-row">
                <span class="c-etq">{{ c.etiqueta }}</span>
                <span class="c-monto">\${{ c.monto | number:'1.0-0' }}</span>
                <span class="c-estado" [class.pagada]="c.pagada" [class.vencida]="c.vencida && !c.pagada">
                  {{ c.pagada ? 'Pagada' : (c.vencida ? 'Vencida' : 'Pendiente') }}
                </span>
                @if (c.pagada) {
                  <button class="c-btn" (click)="marcar(c, false)">Deshacer</button>
                } @else {
                  <button class="c-btn pagar" (click)="marcar(c, true)">Marcar pagada</button>
                }
              </div>
            }
          </div>
        }
      } @else {
        <div class="mis-cuotas">
          @for (c of cuotas(); track c.id) {
            <div class="cuota-row">
              <span class="c-etq">{{ c.etiqueta }}</span>
              <span class="c-vto">vence {{ c.vencimiento | date:'dd/MM' }}</span>
              <span class="c-monto">\${{ c.monto | number:'1.0-0' }}</span>
              <span class="c-estado" [class.pagada]="c.pagada" [class.vencida]="c.vencida && !c.pagada">
                {{ c.pagada ? 'Pagada' : (c.vencida ? 'Vencida' : 'Pendiente') }}
              </span>
            </div>
          }
          <p class="msg-muted" style="font-size:.74rem; margin-top:6px">Los pagos los registra la directiva.</p>
        </div>
      }
    }
  }
</div>
  `,
  styles: [`
    .cuotas { border-top: 1px solid #f3f4f6; padding-top: 0.75rem; margin-top: 0.5rem; }
    .periodo-info { font-size: 0.82rem; color: #0f766e; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 6px; padding: 8px 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .btn-editar { margin-left: auto; background: #fff; border: 1px solid #99f6e4; color: #0f766e; border-radius: 5px; padding: 3px 10px; font-size: 0.76rem; cursor: pointer; }
    .btn-cerrar { background: #fff; border: 1px solid #fca5a5; color: #dc2626; border-radius: 5px; padding: 3px 10px; font-size: 0.76rem; cursor: pointer; }
    .editar-monto { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 0.8rem; }
    .editar-monto input { width: 120px; padding: 5px 8px; border: 1px solid #d1d5db; border-radius: 5px; }
    .edit-nota { font-size: 0.72rem; color: #6b7280; }
    .activar-form { background: #f9fafb; border-radius: 6px; padding: 0.75rem; }
    .af-title { font-size: 0.8rem; font-weight: 700; color: #374151; margin-bottom: 6px; }
    .af-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .af-row .field { margin-bottom: 0; }
    .socio-cuotas { margin-top: 0.75rem; }
    .sc-head { font-size: 0.8rem; font-weight: 700; color: #1f2937; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 3px; }
    .sc-pend { font-size: 0.72rem; color: #b45309; font-weight: 600; }
    .cuota-row { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; padding: 4px 0; }
    .c-etq { flex: 1; color: #374151; }
    .c-vto { color: #9ca3af; font-size: 0.74rem; }
    .c-monto { font-weight: 700; color: #047857; }
    .c-estado { font-size: 0.72rem; font-weight: 700; padding: 1px 8px; border-radius: 999px; background: #fef9c3; color: #854d0e; }
    .c-estado.pagada { background: #ecfdf5; color: #047857; }
    .c-estado.vencida { background: #fee2e2; color: #b91c1c; }
    .c-btn { border: 1px solid #d1d5db; background: #fff; border-radius: 5px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; }
    .c-btn.pagar { background: #059669; color: #fff; border-color: #059669; }
    .mis-cuotas { margin-top: 0.5rem; }
  `],
})
export class CuotasPanel implements OnInit {
  @Input({ required: true }) agrupacionId!: string;

  private readonly svc = inject(CuotaService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  periodo = signal<CuotaPeriodo | null>(null);
  cuotas = signal<Cuota[]>([]);
  loading = signal(true);
  saving = signal(false);
  editando = signal(false);
  montoEdit = 0;
  form: CuotaActivarRequest = { monto: 2000, periodicidad: 'MENSUAL', fechaInicio: '', fechaFin: '' };

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    this.loading.set(true);
    this.svc.periodo(this.agrupacionId).subscribe({ next: (p) => this.periodo.set(p) });
    const obs = this.isAdmin() ? this.svc.todas(this.agrupacionId) : this.svc.mias(this.agrupacionId);
    obs.subscribe({
      next: (c) => { this.cuotas.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  grupos(): GrupoSocio[] {
    const map = new Map<string, Cuota[]>();
    for (const c of this.cuotas()) {
      if (!map.has(c.vecinoEmail)) map.set(c.vecinoEmail, []);
      map.get(c.vecinoEmail)!.push(c);
    }
    return [...map.entries()].map(([email, cuotas]) => ({
      email, cuotas, pendientes: cuotas.filter((x) => !x.pagada).length,
    }));
  }

  activar(): void {
    this.saving.set(true);
    this.svc.activar(this.agrupacionId, this.form).subscribe({
      next: (p) => { this.periodo.set(p); this.saving.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  cerrar(): void {
    if (!confirm('¿Cerrar el período de cuotas? Se notificará a los socios y no se generarán más cuotas.')) return;
    this.svc.cerrar(this.agrupacionId).subscribe({ next: () => this.periodo.set(null) });
  }

  abrirEditor(montoActual: number): void {
    if (this.editando()) { this.editando.set(false); return; }
    this.montoEdit = montoActual;
    this.editando.set(true);
  }

  guardarMonto(): void {
    this.saving.set(true);
    this.svc.actualizarMonto(this.agrupacionId, this.montoEdit).subscribe({
      next: (p) => { this.periodo.set(p); this.editando.set(false); this.saving.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  marcar(c: Cuota, pagada: boolean): void {
    const obs = pagada ? this.svc.pagar(c.id) : this.svc.pendiente(c.id);
    obs.subscribe({ next: (u) => this.cuotas.update((prev) => prev.map((x) => x.id === u.id ? u : x)) });
  }
}
