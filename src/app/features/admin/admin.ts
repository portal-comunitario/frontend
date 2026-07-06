import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AvisoService } from '../../community/aviso.service';
import { Aviso } from '../../community/aviso.models';
import { AVISO_COLORS, AVISO_LABELS } from '../../community/aviso.ui';
import { AuthService } from '../../auth/auth.service';
import { CertificadoService } from '../../certificado/certificado.service';
import { SolicitudCertificado } from '../../certificado/certificado.models';
import { Vecino } from '../../auth/models/auth.models';
import { environment } from '../../../environments/environment';

/** Sección Administración — moderación del Tablón, gestión de vecinos y módulos futuros. */
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
      <h2>Cola de moderación — Avisos</h2>
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
    <div class="admin-section-head">
      <h2>Gestión de Vecinos</h2>
      <span class="count-badge">{{ vecinosPendientes() }} por validar</span>
    </div>
    <p class="msg-muted" style="font-size:.82rem; margin-top:-0.75rem">
      Valida la residencia de cada vecino. Solo los vecinos validados pueden solicitar certificados e inscribirse a agrupaciones.
    </p>
    @if (vecinosLoading()) {
      <p class="msg-muted">Cargando vecinos…</p>
    } @else if (vecinos().length === 0) {
      <div class="empty-state"><span>👥</span><p>No hay vecinos registrados.</p></div>
    } @else {
      <div class="moderation-list">
        @for (v of vecinos(); track v.id) {
          <div class="mod-item">
            <div class="mod-item-left">
              <div class="v-avatar">{{ iniciales(v.name) }}</div>
              <div>
                <div class="mod-title">
                  {{ v.name }}
                  @if (v.estadoValidacion === 'VALIDADO') { <span class="badge-ok">✔ Validado</span> }
                  @else { <span class="badge-pend">Pendiente</span> }
                  @if (v.role !== 'VECINO') { <span class="badge-rol">{{ rolLabel(v.role) }}</span> }
                </div>
                <div class="mod-meta">{{ v.email }}</div>
                <div class="v-datos">
                  <span>{{ v.rut || 'Sin RUT' }}</span>
                  <span>📞 {{ v.telefono || 'Sin teléfono' }}</span>
                  <span>📍 {{ v.direccion || 'Sin dirección' }}</span>
                  @if (v.inicioResidencia) { <span>Reside desde {{ v.inicioResidencia | date:'MM/yyyy' }}</span> }
                </div>
              </div>
            </div>
            <div class="mod-actions">
              @if (v.estadoValidacion === 'VALIDADO') {
                <button class="btn-rechazar" (click)="revocar(v)">Revocar</button>
              } @else {
                <button class="btn-aprobar" (click)="validar(v)">✔ Validar residencia</button>
              }
            </div>
          </div>
        }
      </div>
    }
  </div>

  <div class="admin-section">
    <div class="admin-section-head">
      <h2>Certificados de residencia</h2>
      <span class="count-badge">{{ certificados().length }} por revisar</span>
    </div>
    @if (certLoading()) {
      <p class="msg-muted">Cargando solicitudes…</p>
    } @else if (certificados().length === 0) {
      <div class="empty-state"><span>📄</span><p>No hay solicitudes de certificado pendientes.</p></div>
    } @else {
      <div class="moderation-list">
        @for (c of certificados(); track c.id) {
          <div class="mod-item">
            <div class="mod-item-left">
              <div class="v-avatar">{{ iniciales(c.vecinoNombre || c.vecinoEmail) }}</div>
              <div>
                <div class="mod-title">{{ c.vecinoNombre || c.vecinoEmail }}</div>
                <div class="mod-meta">{{ c.vecinoEmail }} · {{ c.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</div>
                @if (c.motivo) { <div class="mod-contenido">Motivo: {{ c.motivo }}</div> }
                <div class="v-datos">
                  <span>RUT declarado: {{ c.rut || '—' }}</span>
                  <span>📍 Dirección declarada: {{ c.direccion || '—' }}</span>
                </div>
                <div class="cert-docs">
                  <button (click)="cert.abrirArchivo(c.id, 'cedula')">Ver cédula</button>
                  <button (click)="cert.abrirArchivo(c.id, 'comprobante')">Ver comprobante</button>
                </div>
              </div>
            </div>
            <div class="mod-actions">
              <button class="btn-aprobar" (click)="aprobarCert(c)">✔ Aprobar y emitir</button>
              <button class="btn-rechazar" (click)="rechazarCert(c)">✕ Rechazar</button>
            </div>
          </div>
        }
      </div>
    }
  </div>


</div>
  `,
  styles: [`
    .v-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e0e7ff; color: #3730a3; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .v-datos { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.78rem; color: #6b7280; margin-top: 4px; }
    .badge-ok { background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .badge-pend { background: #fef9c3; color: #854d0e; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .cert-docs { display: flex; gap: 8px; margin-top: 6px; }
    .cert-docs button { background: #eef2ff; color: #3730a3; border: none; border-radius: 5px; padding: 3px 10px; font-size: 0.76rem; cursor: pointer; }
    .cert-docs button:hover { background: #e0e7ff; }
    .badge-rol { background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
  `],
})
export class Admin implements OnInit {
  private readonly svc = inject(AvisoService);
  private readonly auth = inject(AuthService);
  protected readonly cert = inject(CertificadoService);
  protected readonly AVISO_COLORS = AVISO_COLORS;
  protected readonly AVISO_LABELS = AVISO_LABELS;
  protected readonly communityName = environment.communityName;

  pendientes = signal<Aviso[]>([]);
  loading = signal(true);
  vecinos = signal<Vecino[]>([]);
  vecinosLoading = signal(true);
  certificados = signal<SolicitudCertificado[]>([]);
  certLoading = signal(true);

  vecinosPendientes = () => this.vecinos().filter((v) => v.estadoValidacion !== 'VALIDADO').length;

  ngOnInit(): void {
    this.load();
    this.loadVecinos();
    this.loadCertificados();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getPendientes().subscribe({
      next: (d) => { this.pendientes.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadVecinos(): void {
    this.vecinosLoading.set(true);
    this.auth.getVecinos().subscribe({
      next: (d) => { this.vecinos.set(d); this.vecinosLoading.set(false); },
      error: () => this.vecinosLoading.set(false),
    });
  }

  aprobar(id: string): void {
    this.svc.aprobar(id).subscribe({ next: () => this.pendientes.update((p) => p.filter((x) => x.id !== id)) });
  }

  rechazar(id: string): void {
    this.svc.rechazar(id).subscribe({ next: () => this.pendientes.update((p) => p.filter((x) => x.id !== id)) });
  }

  validar(v: Vecino): void {
    this.auth.validarVecino(v.id).subscribe({ next: (u) => this.patchVecino(u) });
  }

  revocar(v: Vecino): void {
    this.auth.revocarVecino(v.id).subscribe({ next: (u) => this.patchVecino(u) });
  }

  private patchVecino(u: Vecino): void {
    this.vecinos.update((prev) => prev.map((x) => x.id === u.id ? u : x));
  }

  private loadCertificados(): void {
    this.certLoading.set(true);
    this.cert.pendientes().subscribe({
      next: (d) => { this.certificados.set(d); this.certLoading.set(false); },
      error: () => this.certLoading.set(false),
    });
  }

  aprobarCert(c: SolicitudCertificado): void {
    this.cert.aprobar(c.id).subscribe({
      next: () => {
        this.certificados.update((p) => p.filter((x) => x.id !== c.id));
        this.loadVecinos();
      },
    });
  }

  rechazarCert(c: SolicitudCertificado): void {
    const motivo = prompt('Motivo del rechazo (opcional):') ?? '';
    this.cert.rechazar(c.id, motivo).subscribe({
      next: () => this.certificados.update((p) => p.filter((x) => x.id !== c.id)),
    });
  }

  iniciales(nombre: string): string {
    return (nombre || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  rolLabel(role: string): string {
    return role === 'COMMUNITY_ADMIN' ? 'Dirigente' : role === 'PLATFORM_ADMIN' ? 'Admin' : 'Vecino';
  }
}
