import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { CuotaService } from '../../community/cuota.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { Cuota, CuotaActivarRequest, CuotaPeriodo } from '../../community/cuota.models';

interface GrupoSocio { email: string; nombre: string; cuotas: Cuota[]; pagadas: number; pendientes: number; }

/** Página dedicada de cuotas de una agrupación: grilla con colores por estado. */
@Component({
  selector: 'app-cuotas-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%)">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a agrupaciones</button>
    <h1>Cuotas · {{ nombre() || 'Agrupación' }}</h1>
    <p>Estado de las cuotas de la agrupación. El color indica si están pagadas, pendientes o vencidas.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando cuotas…</p>
  } @else {

    @if (periodo(); as p) {
      <div class="periodo-bar">
        <div>
          <strong>Cuotas activas</strong>
          <span class="pb-detalle">\${{ p.monto | number:'1.0-0' }} {{ p.periodicidad === 'SEMANAL' ? 'semanal' : 'mensual' }}
            · {{ p.fechaInicio | date:'dd/MM/yyyy' }} → {{ p.fechaFin | date:'dd/MM/yyyy' }}</span>
        </div>
        @if (isAdmin()) {
          <div class="pb-acciones">
            @if (editando()) {
              <input type="number" min="1" [(ngModel)]="montoEdit" class="monto-input" />
              <button class="btn-primary" [disabled]="saving() || !montoEdit || montoEdit <= 0" (click)="guardarMonto()">Guardar</button>
              <button class="btn-ghost" (click)="editando.set(false)">Cancelar</button>
            } @else {
              <button class="btn-sec" (click)="abrirEditor(p.monto)">✎ Editar monto</button>
              <button class="btn-cerrar" (click)="cerrar()">Cerrar período</button>
            }
          </div>
        }
      </div>
    } @else if (isAdmin()) {
      <div class="form-panel">
        <h3>Activar cuotas</h3>
        <form (ngSubmit)="activar()" #f="ngForm">
          <div class="form-row">
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
            <div class="field"><label>Desde</label><input name="ini" type="date" [(ngModel)]="form.fechaInicio" required /></div>
            <div class="field"><label>Hasta</label><input name="fin" type="date" [(ngModel)]="form.fechaFin" required /></div>
          </div>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">Activar cuotas</button>
        </form>
      </div>
    } @else {
      <div class="empty-state"><span>💰</span><p>Esta agrupación no tiene cuotas activas.</p></div>
    }

    @if (cuotas().length > 0) {
      <div class="resumen">
        <span class="chip-resumen pagada">{{ totalPagadas() }} pagadas</span>
        <span class="chip-resumen pendiente">{{ totalPendientes() }} pendientes</span>
        <span class="chip-resumen vencida">{{ totalVencidas() }} vencidas</span>
      </div>

      @if (isAdmin()) {
        @for (g of grupos(); track g.email) {
          <div class="socio-block">
            <div class="socio-cab">
              <span class="socio-nombre">{{ g.nombre }}</span>
              <span class="socio-mail">{{ g.email }}</span>
              <span class="socio-prog">{{ g.pagadas }}/{{ g.cuotas.length }} pagadas</span>
            </div>
            <div class="grid-cuotas">
              @for (c of g.cuotas; track c.id) {
                <div class="cuota-card" [class.pagada]="c.pagada" [class.vencida]="c.vencida && !c.pagada">
                  <div class="cc-etq">{{ c.etiqueta }}</div>
                  <div class="cc-monto">\${{ c.monto | number:'1.0-0' }}</div>
                  <div class="cc-vto">vence {{ c.vencimiento | date:'dd/MM' }}</div>
                  <div class="cc-estado">{{ estado(c) }}</div>
                  <button class="cc-btn" (click)="marcar(c, !c.pagada)">{{ c.pagada ? 'Deshacer' : 'Marcar pagada' }}</button>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="grid-cuotas">
          @for (c of cuotas(); track c.id) {
            <div class="cuota-card" [class.pagada]="c.pagada" [class.vencida]="c.vencida && !c.pagada">
              <div class="cc-etq">{{ c.etiqueta }}</div>
              <div class="cc-monto">\${{ c.monto | number:'1.0-0' }}</div>
              <div class="cc-vto">vence {{ c.vencimiento | date:'dd/MM' }}</div>
              <div class="cc-estado">{{ estado(c) }}</div>
            </div>
          }
        </div>
        <p class="msg-muted" style="font-size:.78rem; margin-top:0.75rem">Los pagos los registra la directiva.</p>
      }
    }
  }
</div>
  `,
  styles: [`
    .btn-volver { background: rgba(255,255,255,0.2); border: none; color: #fff; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; margin-bottom: 0.75rem; }
    .btn-volver:hover { background: rgba(255,255,255,0.32); }
    .periodo-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 12px 16px; margin-bottom: 1rem; }
    .periodo-bar strong { color: #0f766e; }
    .pb-detalle { color: #0f766e; font-size: 0.86rem; margin-left: 8px; }
    .pb-acciones { display: flex; align-items: center; gap: 8px; }
    .monto-input { width: 110px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; }
    .btn-sec { background: #fff; border: 1px solid #99f6e4; color: #0f766e; border-radius: 6px; padding: 5px 12px; font-size: 0.8rem; cursor: pointer; }
    .btn-cerrar { background: #fff; border: 1px solid #fca5a5; color: #dc2626; border-radius: 6px; padding: 5px 12px; font-size: 0.8rem; cursor: pointer; }
    .resumen { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1rem; }
    .chip-resumen { font-size: 0.8rem; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
    .chip-resumen.pagada { background: #ecfdf5; color: #047857; }
    .chip-resumen.pendiente { background: #fef9c3; color: #854d0e; }
    .chip-resumen.vencida { background: #fee2e2; color: #b91c1c; }
    .socio-block { margin-bottom: 1.5rem; }
    .socio-cab { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px; margin-bottom: 10px; }
    .socio-nombre { font-weight: 700; color: #1f2937; }
    .socio-mail { font-size: 0.76rem; color: #9ca3af; }
    .socio-prog { margin-left: auto; font-size: 0.78rem; font-weight: 600; color: #0f766e; }
    .grid-cuotas { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .cuota-card { border: 1px solid #e5e7eb; border-left: 4px solid #eab308; border-radius: 8px; padding: 10px 12px; background: #fffbeb; }
    .cuota-card.pagada { border-left-color: #16a34a; background: #f0fdf4; }
    .cuota-card.vencida { border-left-color: #dc2626; background: #fef2f2; }
    .cc-etq { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .cc-monto { font-size: 1.05rem; font-weight: 800; color: #047857; margin: 2px 0; }
    .cc-vto { font-size: 0.72rem; color: #9ca3af; }
    .cc-estado { font-size: 0.74rem; font-weight: 700; margin: 4px 0; color: #854d0e; }
    .cuota-card.pagada .cc-estado { color: #047857; }
    .cuota-card.vencida .cc-estado { color: #b91c1c; }
    .cc-btn { width: 100%; margin-top: 4px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 4px; font-size: 0.74rem; cursor: pointer; }
    .cuota-card:not(.pagada) .cc-btn { background: #059669; color: #fff; border-color: #059669; }
  `],
})
export class CuotasPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(CuotaService);
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  agrupacionId = '';
  nombre = signal('');
  periodo = signal<CuotaPeriodo | null>(null);
  cuotas = signal<Cuota[]>([]);
  loading = signal(true);
  saving = signal(false);
  editando = signal(false);
  montoEdit = 0;
  vecinoNombre = signal<Record<string, string>>({});
  form: CuotaActivarRequest = { monto: 2000, periodicidad: 'MENSUAL', fechaInicio: '', fechaFin: '' };

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
    this.svc.periodo(this.agrupacionId).subscribe({ next: (p) => this.periodo.set(p) });
    const obs = this.isAdmin() ? this.svc.todas(this.agrupacionId) : this.svc.mias(this.agrupacionId);
    obs.subscribe({
      next: (c) => { this.cuotas.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  estado(c: Cuota): string { return c.pagada ? 'Pagada' : (c.vencida ? 'Vencida' : 'Pendiente'); }

  totalPagadas = () => this.cuotas().filter((c) => c.pagada).length;
  totalVencidas = () => this.cuotas().filter((c) => c.vencida && !c.pagada).length;
  totalPendientes = () => this.cuotas().filter((c) => !c.pagada && !c.vencida).length;

  grupos(): GrupoSocio[] {
    const map = new Map<string, Cuota[]>();
    for (const c of this.cuotas()) {
      if (!map.has(c.vecinoEmail)) map.set(c.vecinoEmail, []);
      map.get(c.vecinoEmail)!.push(c);
    }
    return [...map.entries()].map(([email, cuotas]) => ({
      email,
      nombre: this.vecinoNombre()[email] ?? email,
      cuotas,
      pagadas: cuotas.filter((x) => x.pagada).length,
      pendientes: cuotas.filter((x) => !x.pagada).length,
    }));
  }

  marcar(c: Cuota, pagada: boolean): void {
    const obs = pagada ? this.svc.pagar(c.id) : this.svc.pendiente(c.id);
    obs.subscribe({ next: (u) => this.cuotas.update((prev) => prev.map((x) => x.id === u.id ? u : x)) });
  }

  abrirEditor(monto: number): void { this.montoEdit = monto; this.editando.set(true); }

  guardarMonto(): void {
    this.saving.set(true);
    this.svc.actualizarMonto(this.agrupacionId, this.montoEdit).subscribe({
      next: (p) => { this.periodo.set(p); this.editando.set(false); this.saving.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  activar(): void {
    this.saving.set(true);
    this.svc.activar(this.agrupacionId, this.form).subscribe({
      next: (p) => { this.periodo.set(p); this.saving.set(false); this.cargar(); },
      error: () => this.saving.set(false),
    });
  }

  cerrar(): void {
    if (!confirm('¿Cerrar el período de cuotas? No se generarán más cuotas.')) return;
    this.svc.cerrar(this.agrupacionId).subscribe({ next: () => this.periodo.set(null) });
  }

  volver(): void { this.router.navigate(['/portal/agrupaciones']); }
}
