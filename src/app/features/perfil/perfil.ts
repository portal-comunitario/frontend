import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { Profile, ProfileUpdate } from '../../auth/models/auth.models';

/** Mi Perfil — datos del vecino. El teléfono habilita las notificaciones por WhatsApp. */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <h1>Mi Perfil</h1>
    <p>Tus datos personales. El teléfono es opcional y sirve para recibir notificaciones por WhatsApp.</p>
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
          <input name="name" [(ngModel)]="form.name" required placeholder="Ej: Juana Pérez" />
        </div>

        <div class="field">
          <label>Teléfono <span class="opt">(para notificaciones por WhatsApp)</span></label>
          <input name="telefono" [(ngModel)]="form.telefono" placeholder="+56 9 1234 5678" />
          <p class="msg-muted" style="font-size:.76rem">Si lo dejas vacío, no recibirás avisos por WhatsApp.</p>
        </div>

        <div class="form-row">
          <div class="field">
            <label>RUT <span class="opt">(opcional)</span></label>
            <input name="rut" [(ngModel)]="form.rut" placeholder="12.345.678-9" />
          </div>
          <div class="field">
            <label>Reside desde <span class="opt">(opcional)</span></label>
            <input name="inicioResidencia" type="date" [(ngModel)]="form.inicioResidencia" />
          </div>
        </div>

        <div class="field">
          <label>Dirección en la comunidad <span class="opt">(opcional)</span></label>
          <input name="direccion" [(ngModel)]="form.direccion" placeholder="Calle y número" />
        </div>

        <div class="validacion-row">
          <span>Estado de validación de residencia:</span>
          @if (profile()!.estadoValidacion === 'VALIDADO') {
            <span class="badge-ok">✔ Validado</span>
          } @else {
            <span class="badge-pend">Pendiente de validación por la directiva</span>
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
  form: ProfileUpdate = { name: '', telefono: null, rut: null, direccion: null, inicioResidencia: null };

  ngOnInit(): void {
    this.auth.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form = {
          name: p.name,
          telefono: p.telefono,
          rut: p.rut,
          direccion: p.direccion,
          inicioResidencia: p.inicioResidencia,
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  guardar(): void {
    this.saving.set(true);
    this.error.set(null);
    this.ok.set(false);
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
