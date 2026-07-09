import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { AvisoService } from '../../community/aviso.service';
import { Aviso } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS } from '../../community/aviso.ui';

@Component({
  selector: 'app-admin-moderacion',
  standalone: true,
  imports: [DatePipe],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a Administración</button>
    <h1>Moderación de avisos</h1>
    <p>{{ pendientes().length }} publicación(es) pendiente(s) de revisión.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando…</p>
  } @else if (pendientes().length === 0) {
    <div class="empty-state"><span>✅</span><p>No hay publicaciones pendientes.</p></div>
  } @else {
    <div class="mod-list">
      @for (a of pendientes(); track a.id) {
        <div class="mod-item">
          <div class="mod-left">
            <span class="tipo-dot" [style.background]="AVISO_COLORS[a.categoria] ?? '#9ca3af'"></span>
            <div>
              <div class="mod-title">{{ a.titulo }}</div>
              <div class="mod-meta">{{ AVISO_LABELS[a.categoria] ?? a.categoria }} · {{ a.authorEmail }} · {{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
              <div class="mod-desc">{{ a.descripcion }}</div>
              @if (a.precio != null) { <div class="mod-extra">$ {{ a.precio }}</div> }
              @if (a.direccion) { <div class="mod-extra">📍 {{ a.direccion }}</div> }
            </div>
          </div>
          <div class="mod-actions">
            <button class="btn-aprobar" (click)="aprobar(a.id)">✔ Aprobar</button>
            <button class="btn-rechazar" (click)="rechazar(a.id)">✕ Rechazar</button>
          </div>
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .btn-volver { background: rgba(255,255,255,0.2); border: none; color: #fff; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; margin-bottom: 0.75rem; }
    .btn-volver:hover { background: rgba(255,255,255,0.32); }
    .mod-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .mod-item { display: flex; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 1rem; }
    .mod-left { display: flex; gap: 10px; }
    .tipo-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .mod-title { font-weight: 700; color: #1f2937; }
    .mod-meta { font-size: 0.76rem; color: #9ca3af; margin: 2px 0; }
    .mod-desc { font-size: 0.86rem; color: #4b5563; }
    .mod-extra { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }
    .mod-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .btn-aprobar { background: #059669; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
    .btn-rechazar { background: #fff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
  `],
})
export class AdminModeracion implements OnInit {
  private readonly svc = inject(AvisoService);
  private readonly router = inject(Router);
  protected readonly AVISO_COLORS = AVISO_COLORS;
  protected readonly AVISO_LABELS = AVISO_LABELS;

  pendientes = signal<Aviso[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.svc.getPendientes().subscribe({
      next: (d) => { this.pendientes.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  aprobar(id: string): void {
    this.svc.aprobar(id).subscribe({ next: () => this.pendientes.update((p) => p.filter((x) => x.id !== id)) });
  }

  rechazar(id: string): void {
    this.svc.rechazar(id).subscribe({ next: () => this.pendientes.update((p) => p.filter((x) => x.id !== id)) });
  }

  volver(): void { this.router.navigate(['/portal/admin']); }
}
