import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Profile, ProfileUpdate } from '../../auth/models/auth.models';

/** Mi Perfil — datos del vecino. Teléfono para WhatsApp; dirección validada vía certificado. */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <h1>Mi Perfil</h1>
    <p>Tus datos personales. El teléfono habilita las notificaciones por WhatsApp.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando perfil…</p>
  } @else if (profile()) {
    <div class="form-panel" style="max-width:640px">
      <h3>Datos de la cuenta</h3>
      <div class="form-row">
        <div class="field">
          <label>Correo</label>
          <input [value]="profile()!.email" disabled />
        </div>
        <div class="field field-sm">
          <label>Rol</label>
          <input [value]="rolLabel(profile()!.role)" disabled />
        </div>
      </div>

      <form (ngSubmit)="guardar()" #f="ngForm">
        <div class="field">
          <label>Nombre completo *</label>
          <input name="name" [(ngModel)]="form.name" required />
        </div>

        <div class="field">
          <label>Teléfono <span class="opt">(para notificaciones por WhatsApp)</span></label>
          <input name="telefono" [(ngModel)]="form.telefono" placeholder="+56 9 1234 5678" />
        </div>

        <div class="notif-row">
          <label class="notif-check" [class.disabled]="!form.telefono">
            <input type="checkbox" name="notif" [(ngModel)]="form.notificacionesActivas" [disabled]="!form.telefono" />
            Recibir notificaciones por WhatsApp
          </label>
          @if (!form.telefono) {
            <span class="msg-muted" style="font-size:.76rem">Agrega un teléfono para poder activarlas.</span>
          }
        </div>

        <div class="form-sub">Datos validados <span class="opt">(se registran al aprobar tu certificado de residencia)</span></div>
        <div class="form-row">
          <div class="field field-sm">
            <label>RUT</label>
            @if (profile()!.rut) {
              <input [value]="profile()!.rut" disabled />
            } @else {
              <div class="sin-dato">Sin validar</div>
            }
          </div>
          <div class="field">
            <label>Dirección</label>
            @if (profile()!.direccion) {
              <input [value]="profile()!.direccion" disabled />
            } @else {
              <div class="sin-dato">
                Sin validar. <a routerLink="/portal/tramites">Solicita un certificado de residencia</a> para registrarla.
              </div>
            }
          </div>
        </div>

        <div class="validacion-row">
          <span>Estado de validación:</span>
          @if (profile()!.estadoValidacion === 'VALIDADO') {
            <span class="badge-ok">✔ Validado</span>
          } @else {
            <span class="badge-pend">Pendiente — valida con un certificado de residencia</span>
          }
        </div>

        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        @if (ok()) { <p class="msg-ok">✔ Perfil actualizado.</p> }

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
  } @else {
    <p class="msg-error">No se pudo cargar el perfil.</p>
  }
</div>
  `,
  styles: [`
    .form-sub { font-size: 0.78rem; font-weight: 700; color: #003087; text-transform: uppercase; letter-spacing: 0.04em; margin: 1rem 0 0.5rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem; }
    .sin-dato { font-size: 0.84rem; color: #6b7280; background: #f8fafc; border: 1px dashed #d1d5db; border-radius: 4px; padding: 8px 10px; }
    .sin-dato a { color: #003087; }
    .notif-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0.25rem 0 0.5rem; }
    .notif-check { display: flex; align-items: center; gap: 8px; font-size: 0.86rem; color: #374151; font-weight: 500; text-transform: none; letter-spacing: 0; cursor: pointer; }
    .notif-check.disabled { color: #9ca3af; cursor: not-allowed; }
    .notif-check input { width: auto; }
    .validacion-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 0.84rem; color: #4b5563; margin: 0.5rem 0 1rem; }
    .badge-ok { background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.78rem; padding: 3px 10px; border-radius: 999px; }
    .badge-pend { background: #fef9c3; color: #854d0e; font-weight: 600; font-size: 0.78rem; padding: 3px 10px; border-radius: 999px; }
  `],
})
export class Perfil implements OnInit {
  private readonly auth = inject(AuthService);

  profile = signal<Profile | null>(null);
  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  ok = signal(false);
  form: ProfileUpdate = { name: '', telefono: null, notificacionesActivas: false };

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form = { name: p.name, telefono: p.telefono, notificacionesActivas: p.notificacionesActivas };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  guardar(): void {
    this.saving.set(true); this.error.set(null); this.ok.set(false);
    if (!this.form.telefono) this.form.notificacionesActivas = false;
    this.auth.updateProfile(this.form).subscribe({
      next: (p) => { this.profile.set(p); this.saving.set(false); this.ok.set(true); },
      error: (e) => {
        this.saving.set(false);
        const err = e as { error?: { error?: string; message?: string } };
        this.error.set(err?.error?.error ?? err?.error?.message ?? 'No se pudo guardar.');
      },
    });
  }

  rolLabel(role: string): string {
    return role === 'COMMUNITY_ADMIN' ? 'Dirigente' : role === 'PLATFORM_ADMIN' ? 'Administrador plataforma' : 'Vecino';
  }
}
