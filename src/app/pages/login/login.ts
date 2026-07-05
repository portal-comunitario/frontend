import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { GoogleSignin } from '../../auth/google-signin/google-signin';
import { AuthResponse } from '../../auth/models/auth.models';
import { environment } from '../../../environments/environment';

type Modo = 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, GoogleSignin],
  template: `
<div class="login-wrap">
  <div class="login-card">
    <div class="login-head">
      <div class="login-logo">🏘️</div>
      <div class="login-title">Portal Comunitario</div>
      <div class="login-sub">{{ communityName }}</div>
    </div>

    <div class="login-tabs">
      <button class="login-tab" [class.active]="modo()==='login'" (click)="setModo('login')">Ingresar</button>
      <button class="login-tab" [class.active]="modo()==='register'" (click)="setModo('register')">Crear cuenta</button>
    </div>

    @if (modo() === 'forgot') {
      <form (ngSubmit)="submit()" #f="ngForm">
        <p class="login-hint">Te enviaremos un enlace para restablecer tu contraseña.</p>
        <div class="field">
          <label>Correo electrónico</label>
          <input name="email" type="email" [(ngModel)]="email" required />
        </div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        @if (info()) { <p class="msg-ok">{{ info() }}</p> }
        @if (resetLink()) {
          <p class="login-hint">Enlace de recuperación (temporal, sin correo aún):</p>
          <a class="reset-link" [href]="resetLink()">{{ resetLink() }}</a>
        }
        <button type="submit" class="btn-login" [disabled]="loading() || !f.valid">
          {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
        </button>
        <button type="button" class="btn-link" (click)="setModo('login')">← Volver a ingresar</button>
      </form>
    } @else {
      <form (ngSubmit)="submit()" #f="ngForm">
        @if (modo() === 'register') {
          <div class="field">
            <label>Nombre completo</label>
            <input name="nombre" [(ngModel)]="nombre" required />
          </div>
        }
        <div class="field">
          <label>Correo electrónico</label>
          <input name="email" type="email" [(ngModel)]="email" required />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input name="password" type="password" [(ngModel)]="password" required minlength="8"
 />
        </div>
        @if (modo() === 'login') {
          <div class="forgot-row">
            <button type="button" class="btn-link" (click)="setModo('forgot')">¿Olvidaste tu contraseña?</button>
          </div>
        }
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <button type="submit" class="btn-login" [disabled]="loading() || !f.valid">
          {{ loading() ? 'Procesando…' : (modo()==='login' ? 'Ingresar' : 'Crear cuenta') }}
        </button>
      </form>

      <div class="login-divider"><span>o continúa con</span></div>
      <div class="google-wrap">
        <app-google-signin (loggedIn)="onLoggedIn($event)" />
      </div>
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
    .login-tabs { display: flex; gap: 6px; background: #f1f3f7; border-radius: 8px; padding: 4px; margin-bottom: 1.25rem; }
    .login-tab { flex: 1; border: none; background: none; padding: 8px; border-radius: 6px; font-size: 0.88rem; font-weight: 600; color: #6b7280; cursor: pointer; }
    .login-tab.active { background: #fff; color: #003087; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .login-hint { font-size: 0.8rem; color: #6b7280; margin: 0 0 0.75rem; }
    .forgot-row { text-align: right; margin: -4px 0 12px; }
    .btn-link { background: none; border: none; color: #003087; font-size: 0.8rem; cursor: pointer; padding: 4px 0; }
    .btn-link:hover { text-decoration: underline; }
    .btn-login { width: 100%; background: #003087; color: #fff; border: none; border-radius: 6px; padding: 11px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 4px; }
    .btn-login:hover { background: #00256b; }
    .btn-login:disabled { opacity: 0.55; cursor: not-allowed; }
    .login-divider { display: flex; align-items: center; gap: 10px; margin: 1.25rem 0; color: #9ca3af; font-size: 0.78rem; }
    .login-divider::before, .login-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .google-wrap { display: flex; justify-content: center; }
    .reset-link { display: block; word-break: break-all; font-size: 0.78rem; color: #003087; margin-bottom: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 0.85rem; }
    .field label { font-size: 0.75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
    .field input { border: 1px solid #d1d5db; border-radius: 6px; padding: 9px 11px; font-size: 0.92rem; }
    .field input:focus { outline: 2px solid #003087; border-color: transparent; }
    .msg-error { color: #dc2626; font-size: 0.8rem; margin: 4px 0; }
    .msg-ok { color: #059669; font-size: 0.8rem; margin: 4px 0; }
  `],
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly communityName = environment.communityName;

  modo = signal<Modo>('login');
  nombre = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);
  resetLink = signal<string | null>(null);

  setModo(m: Modo): void {
    this.modo.set(m);
    this.error.set(null);
    this.info.set(null);
    this.resetLink.set(null);
  }

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    if (this.modo() === 'login') {
      this.auth.login(this.email, this.password).subscribe({
        next: () => this.goToApp(),
        error: (e) => this.fail(e),
      });
    } else if (this.modo() === 'register') {
      this.auth.register(this.nombre, this.email, this.password).subscribe({
        next: () => this.goToApp(),
        error: (e) => this.fail(e),
      });
    } else {
      this.auth.forgotPassword(this.email).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.info.set(res.message);
          this.resetLink.set(res.resetLink ?? null);
        },
        error: (e) => this.fail(e),
      });
    }
  }

  onLoggedIn(_auth: AuthResponse): void {
    this.goToApp();
  }

  private goToApp(): void {
    this.loading.set(false);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/portal';
    void this.router.navigateByUrl(returnUrl);
  }

  private fail(e: unknown): void {
    this.loading.set(false);
    const err = e as { error?: { error?: string; message?: string } };
    this.error.set(err?.error?.error ?? err?.error?.message ?? 'Ocurrió un error. Intenta nuevamente.');
  }
}
