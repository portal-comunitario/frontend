import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PlatformService } from './platform.service';

@Component({
  selector: 'app-platform-login',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="pl-wrap">
  <div class="pl-card">
    <div class="pl-badge">🏛️ Plataforma</div>
    <h1>Administración de comunidades</h1>
    <p class="pl-sub">Acceso exclusivo del equipo municipal.</p>
    <form (ngSubmit)="entrar()" #f="ngForm">
      <div class="field">
        <label>Correo</label>
        <input name="email" type="email" [(ngModel)]="email" required />
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input name="password" type="password" [(ngModel)]="password" required />
      </div>
      @if (error()) { <p class="msg-error">{{ error() }}</p> }
      <button type="submit" class="btn-primary" [disabled]="cargando() || !f.valid">
        {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </div>
</div>
  `,
  styles: [`
    .pl-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#1f2937 0%,#374151 60%,#4b5563 100%); padding: 1.5rem; }
    .pl-card { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 380px; box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
    .pl-badge { display: inline-block; background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 0.78rem; padding: 4px 12px; border-radius: 999px; margin-bottom: 0.75rem; }
    .pl-card h1 { margin: 0 0 0.25rem; font-size: 1.3rem; color: #1f2937; }
    .pl-sub { margin: 0 0 1.25rem; color: #6b7280; font-size: 0.86rem; }
    .field { margin-bottom: 0.9rem; }
    .field label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .field input { width: 100%; padding: 9px 11px; border: 1px solid #d1d5db; border-radius: 7px; font-size: 0.9rem; }
    .btn-primary { width: 100%; background: #1f2937; color: #fff; border: none; border-radius: 7px; padding: 11px; font-size: 0.92rem; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #111827; }
    .msg-error { color: #dc2626; font-size: 0.82rem; margin: 0 0 0.75rem; }
  `],
})
export class PlatformLogin {
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  cargando = signal(false);
  error = signal<string | null>(null);

  entrar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.platform.login(this.email.trim(), this.password).subscribe({
      next: () => { this.cargando.set(false); void this.router.navigate(['/comunidades']); },
      error: () => { this.cargando.set(false); this.error.set('Credenciales inválidas.'); },
    });
  }
}
