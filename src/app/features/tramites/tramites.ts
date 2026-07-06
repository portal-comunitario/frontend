import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CertificadoService } from '../../certificado/certificado.service';
import { SolicitudCertificado } from '../../certificado/certificado.models';
import { validarRut, formatearRut } from '../../core/rut.util';

/** Trámites — solicitud de certificado de residencia con documentos. */
@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#003087 0%,#0055b3 60%,#0077cc 100%)">
  <div class="hero-inner">
    <h1>Certificado de Residencia</h1>
    <p>Solicítalo adjuntando tu cédula y un comprobante de domicilio. La directiva lo revisa y lo emite.</p>
  </div>
</section>

<div class="content-area">
  <div class="form-panel" style="max-width:640px">
    <h3>Nueva solicitud</h3>
    <form (ngSubmit)="enviar()" #f="ngForm">
      <div class="field">
        <label>Motivo <span class="opt">(para qué lo necesitas)</span></label>
        <input name="motivo" [(ngModel)]="motivo" placeholder="Ej: trámite bancario, postulación, etc." />
      </div>
      <div class="form-row">
        <div class="field">
          <label>RUT *</label>
          <input name="rut" [(ngModel)]="rut" required placeholder="12.345.678-9" (blur)="formatearRut()" />
          @if (rut.trim() && !rutValido()) { <p class="msg-error" style="font-size:.76rem">RUT inválido. Revisa el dígito verificador.</p> }
        </div>
        <div class="field">
          <label>Dirección de residencia *</label>
          <input name="direccion" [(ngModel)]="direccion" required placeholder="Calle, número, villa/población" />
        </div>
      </div>
      <div class="field">
        <label>Cédula de identidad (foto) *</label>
        <input name="cedula" type="file" accept="image/*" (change)="onCedula($event)" required />
      </div>
      <div class="field">
        <label>Comprobante de domicilio (imagen o PDF) *</label>
        <input name="comprobante" type="file" accept="image/*,application/pdf" (change)="onComprobante($event)" required />
        <p class="msg-muted" style="font-size:.76rem">Cuenta de servicios (luz, agua, internet), contrato de arriendo, etc.</p>
      </div>
      @if (error()) { <p class="msg-error">{{ error() }}</p> }
      <div class="form-actions">
        <button type="submit" class="btn-primary" [disabled]="enviando() || !cedula || !comprobante || !direccion.trim() || !rutValido()">
          {{ enviando() ? 'Enviando…' : 'Enviar solicitud' }}
        </button>
      </div>
    </form>
  </div>

  <h2 class="section-title">Mis solicitudes</h2>
  @if (loading()) {
    <p class="msg-muted">Cargando…</p>
  } @else if (solicitudes().length === 0) {
    <p class="msg-muted">Aún no has solicitado certificados.</p>
  } @else {
    <div class="sol-list">
      @for (s of solicitudes(); track s.id) {
        <div class="sol-item">
          <div class="sol-info">
            <div class="sol-top">
              @if (s.estado === 'EMITIDO') { <span class="badge-ok">Emitido</span> }
              @else if (s.estado === 'RECHAZADO') { <span class="badge-rech">Rechazado</span> }
              @else { <span class="badge-pend">En revisión</span> }
              @if (s.folio) { <span class="sol-folio">Folio {{ s.folio }}</span> }
            </div>
            <div class="sol-meta">Solicitado el {{ s.fechaSolicitud | date:'dd/MM/yyyy HH:mm' }}</div>
            @if (s.estado === 'EMITIDO' && s.fechaVencimiento) {
              <div class="sol-vence">Válido hasta el {{ s.fechaVencimiento | date:'dd/MM/yyyy' }}</div>
            }
            @if (s.motivo) { <div class="sol-motivo">{{ s.motivo }}</div> }
            @if (s.estado === 'RECHAZADO' && s.motivoRechazo) {
              <div class="sol-rechazo">Motivo: {{ s.motivoRechazo }}</div>
            }
          </div>
          <div class="sol-acciones">
            @if (s.estado === 'EMITIDO' && s.tienePdf) {
              <button class="btn-primary" (click)="svc.abrirArchivo(s.id, 'pdf')">Descargar certificado</button>
            }
            <button class="btn-eliminar" (click)="eliminar(s)" title="Eliminar solicitud">✕</button>
          </div>
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .sol-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .sol-item { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .sol-acciones { display: flex; align-items: center; gap: 8px; }
    .sol-top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .sol-folio { font-size: 0.78rem; color: #6b7280; }
    .sol-meta { font-size: 0.78rem; color: #9ca3af; }
    .sol-motivo { font-size: 0.85rem; color: #4b5563; margin-top: 2px; }
    .sol-rechazo { font-size: 0.8rem; color: #b91c1c; margin-top: 4px; }
    .sol-vence { font-size: 0.78rem; color: #047857; margin-top: 2px; }
    .badge-ok { background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; }
    .badge-pend { background: #fef9c3; color: #854d0e; font-weight: 700; font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; }
    .btn-eliminar { background: none; border: none; color: #d1d5db; font-size: 1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
    .btn-eliminar:hover { color: #ef4444; background: #fef2f2; }
    .badge-rech { background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; }
  `],
})
export class Tramites implements OnInit {
  protected readonly svc = inject(CertificadoService);

  motivo = '';
  rut = '';
  direccion = '';
  cedula: File | null = null;
  comprobante: File | null = null;
  solicitudes = signal<SolicitudCertificado[]>([]);
  loading = signal(true);
  enviando = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    this.loading.set(true);
    this.svc.mias().subscribe({
      next: (d) => { this.solicitudes.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  rutValido(): boolean {
    return validarRut(this.rut);
  }

  formatearRut(): void {
    if (this.rutValido()) this.rut = formatearRut(this.rut);
  }

  eliminar(s: SolicitudCertificado): void {
    if (!confirm('¿Eliminar esta solicitud de certificado?')) return;
    this.svc.eliminar(s.id).subscribe({
      next: () => this.solicitudes.update((prev) => prev.filter((x) => x.id !== s.id)),
    });
  }

  onCedula(e: Event): void { this.cedula = (e.target as HTMLInputElement).files?.[0] ?? null; }
  onComprobante(e: Event): void { this.comprobante = (e.target as HTMLInputElement).files?.[0] ?? null; }

  enviar(): void {
    if (!this.cedula || !this.comprobante || !this.direccion.trim() || !this.rutValido()) return;
    this.enviando.set(true); this.error.set(null);
    this.svc.crear(this.motivo, this.rut, this.direccion, this.cedula, this.comprobante).subscribe({
      next: (s) => {
        this.solicitudes.update((prev) => [s, ...prev]);
        this.motivo = ''; this.rut = ''; this.direccion = ''; this.cedula = null; this.comprobante = null;
        this.enviando.set(false);
      },
      error: (e) => {
        this.enviando.set(false);
        const err = e as { error?: { error?: string; message?: string } };
        this.error.set(err?.error?.error ?? err?.error?.message ?? 'No se pudo enviar la solicitud.');
      },
    });
  }
}
