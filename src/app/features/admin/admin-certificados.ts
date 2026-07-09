import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { CertificadoService } from '../../certificado/certificado.service';
import { SolicitudCertificado } from '../../certificado/certificado.models';

@Component({
  selector: 'app-admin-certificados',
  standalone: true,
  imports: [DatePipe],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a Administración</button>
    <h1>Certificados de residencia</h1>
    <p>{{ certificados().length }} solicitud(es) por revisar.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando solicitudes…</p>
  } @else if (certificados().length === 0) {
    <div class="empty-state"><span>📄</span><p>No hay solicitudes pendientes.</p></div>
  } @else {
    <div class="cert-list">
      @for (c of certificados(); track c.id) {
        <div class="cert-item">
          <div class="cert-info">
            <div class="cert-title">{{ c.vecinoNombre || c.vecinoEmail }}</div>
            <div class="cert-meta">{{ c.vecinoEmail }} · {{ c.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</div>
            @if (c.motivo) { <div class="cert-motivo">Motivo: {{ c.motivo }}</div> }
            <div class="cert-datos">
              <span>RUT: {{ c.rut || '—' }}</span>
              <span>📍 {{ c.direccion || '—' }}</span>
            </div>
            <div class="cert-docs">
              <button (click)="cert.abrirArchivo(c.id, 'cedula')">Ver cédula</button>
              <button (click)="cert.abrirArchivo(c.id, 'comprobante')">Ver comprobante</button>
            </div>
          </div>
          <div class="cert-actions">
            <button class="b-ok" (click)="aprobar(c)">✔ Aprobar y emitir</button>
            <button class="b-no" (click)="rechazar(c)">✕ Rechazar</button>
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
    .cert-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .cert-item { display: flex; justify-content: space-between; gap: 12px; background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 1rem; }
    .cert-title { font-weight: 700; color: #1f2937; }
    .cert-meta { font-size: 0.76rem; color: #9ca3af; margin: 2px 0; }
    .cert-motivo { font-size: 0.86rem; color: #4b5563; }
    .cert-datos { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.8rem; color: #6b7280; margin: 4px 0; }
    .cert-docs { display: flex; gap: 8px; margin-top: 4px; }
    .cert-docs button { background: #eef2ff; color: #3730a3; border: none; border-radius: 5px; padding: 3px 10px; font-size: 0.76rem; cursor: pointer; }
    .cert-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .b-ok { background: #059669; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
    .b-no { background: #fff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
  `],
})
export class AdminCertificados implements OnInit {
  protected readonly cert = inject(CertificadoService);
  private readonly router = inject(Router);

  certificados = signal<SolicitudCertificado[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.cert.pendientes().subscribe({
      next: (d) => { this.certificados.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  aprobar(c: SolicitudCertificado): void {
    this.cert.aprobar(c.id).subscribe({
      next: () => this.certificados.update((p) => p.filter((x) => x.id !== c.id)),
    });
  }

  rechazar(c: SolicitudCertificado): void {
    const motivo = prompt('Motivo del rechazo (opcional):') ?? '';
    this.cert.rechazar(c.id, motivo).subscribe({
      next: () => this.certificados.update((p) => p.filter((x) => x.id !== c.id)),
    });
  }

  volver(): void { this.router.navigate(['/portal/admin']); }
}
