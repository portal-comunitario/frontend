import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="login-wrap">
  <div class="login-card">
    <div class="login-head">
      <div class="login-logo">🏘️</div>
      <div class="login-title">Nueva contraseña</div>
      <div class="login-sub">{{ communityName }}</div>
    </div>

    @if (!token) {
      <p class="msg-error">Enlace inválido: falta el token de recuperación.</p>
      <button class="btn-login" (click)="irLogin()">Ir a ingresar</button>
    } @else if (listo()) {
      <p class="msg-ok">{{ info() }}</p>
      <button class="btn-login" (click)="irLogin()">Ir a ingresar</button>
    } @else {
      <form (ngSubmit)="submit()" #f="ngForm">
        <div class="field">
          <label>Nueva contraseña</label>
          <input name="password" type="password" [(ngModel)]="password" required minlength="8"
 />
        </div>
        <div class="field">
          <label>Repetir contraseña</label>
          <input name="confirm" type="password" [(ngModel)]="confirm" required />
        </div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <button type="submit" class="btn-login" [disabled]="loading() || !f.valid">
          {{ loading() ? 'Guardando…' : 'Cambiar contraseña' }}
        </button>
      </form>
    }
  </div>
</div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f6f9; padding: 1rem; }
    .login-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.75rem 1.5rem; }
    .login-head { text-align: center; margin-bottom: 1.5rem; }
    .login-logo { width: 52px; height: 52px; border-radius: 14px; background: #003087; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 10px; }
    .login-title { font-size: 1.15rem; font-weight: 800; color: #003087; }
    .login-sub { font-size: 0.82rem; color: #6b7280; }
    .btn-login { width: 100%; background: #003087; color: #fff; border: none; border-radius: 6px; padding: 11px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 4px; }
    .btn-login:hover { background: #00256b; }
    .btn-login:disabled { opacity: 0.55; cursor: not-allowed; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.85rem; }
    .field label { font-size: 0.75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
    .field input { border: 1px solid #d1d5db; border-radius: 6px; padding: 9px 11px; font-size: 0.92rem; }
    .field input:focus { outline: 2px solid #003087; border-color: transparent; }
    .msg-error { color: #dc2626; font-size: 0.8rem; margin: 4px 0; }
    .msg-ok { color: #059669; font-size: 0.85rem; margin: 4px 0 12px; }
  `],
})
export class Reset implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly communityName = environment.communityName;

  token = '';
  password = '';
  confirm = '';
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);
  listo = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.error.set(null);
    if (this.password !== this.confirm) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res) => { this.loading.set(false); this.listo.set(true); this.info.set(res.message); },
      error: (e) => {
        this.loading.set(false);
        const err = e as { error?: { error?: string; message?: string } };
        this.error.set(err?.error?.error ?? err?.error?.message ?? 'No se pudo cambiar la contraseña.');
      },
    });
  }

  irLogin(): void { void this.router.navigate(['/login']); }
}
