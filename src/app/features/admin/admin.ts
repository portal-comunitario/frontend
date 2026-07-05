import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AvisoService } from '../../community/aviso.service';
import { Aviso } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS } from '../../community/aviso.ui';
import { environment } from '../../../environments/environment';

/** Sección Administración — cola de moderación del Tablón + módulos futuros (Obj. 4 y 5). */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <h1>Administración</h1>
    <p>Panel de moderación y gestión de la comunidad {{ communityName }}.</p>
  </div>
</section>
<div class="content-area">

  <div class="admin-section">
    <div class="admin-section-head">
      <h2>Cola de moderación — Tablón</h2>
      <span class="count-badge">{{ pendientes().length }} pendiente{{ pendientes().length === 1 ? '' : 's' }}</span>
    </div>
    @if (loading()) {
      <p class="msg-muted">Cargando publicaciones pendientes…</p>
    } @else if (pendientes().length === 0) {
      <div class="empty-state"><span>✅</span><p>No hay publicaciones pendientes de revisión.</p></div>
    } @else {
      <div class="moderation-list">
        @for (a of pendientes(); track a.id) {
          <div class="mod-item">
            <div class="mod-item-left">
              <span class="tipo-dot" [style.background]="AVISO_COLORS[a.categoria] ?? '#9ca3af'"></span>
              <div>
                <div class="mod-title">{{ a.titulo }}</div>
                <div class="mod-meta">{{ AVISO_LABELS[a.categoria] ?? a.categoria }} · {{ a.authorEmail }} · {{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="mod-contenido">{{ a.descripcion }}</div>
                @if (a.precio != null) { <div class="mod-dir">$ {{ a.precio }}</div> }
                @if (a.direccion) { <div class="mod-dir">📍 {{ a.direccion }}</div> }
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

  <div class="admin-section">
    <div class="admin-section-head"><h2>Módulos de gestión</h2></div>
    <div class="admin-grid">
      @for (item of adminItems; track item.title) {
        <div class="admin-card">
          <div class="admin-icon">{{ item.icon }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
          <span class="coming-soon">Próximamente</span>
        </div>
      }
    </div>
  </div>

</div>
  `,
})
export class Admin implements OnInit {
  private readonly svc = inject(AvisoService);
  protected readonly AVISO_COLORS = AVISO_COLORS;
  protected readonly AVISO_LABELS = AVISO_LABELS;
  protected readonly communityName = environment.communityName;

  pendientes = signal<Aviso[]>([]);
  loading = signal(true);

  adminItems = [
    { icon: '👥', title: 'Gestión de Vecinos', desc: 'Validar residencia, roles y perfiles.' },
    { icon: '🏛️', title: 'Clubs y Socios', desc: 'Club adulto mayor, centro de madres e inscripciones.' },
    { icon: '💰', title: 'Cuotas', desc: 'Planes de cuota por club y control de pagos.' },
    { icon: '📋', title: 'Asistencia', desc: 'Registro de asistencia a actividades.' },
    { icon: '📄', title: 'Certificados', desc: 'Cola de solicitudes y emisión de certificados de residencia.' },
  ];

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
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
}
