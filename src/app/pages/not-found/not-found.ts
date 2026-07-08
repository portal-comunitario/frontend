import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página 404 — ruta inexistente. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
<div class="nf">
  <div class="nf-code">404</div>
  <h1>Página no encontrada</h1>
  <p>La dirección que ingresaste no existe o la comunidad no está disponible.</p>
  <div class="nf-actions">
    <a class="btn-primary" routerLink="/portal">Ir al portal</a>
    <a class="btn-ghost" routerLink="/platform/login">Panel de plataforma</a>
  </div>
</div>
  `,
  styles: [`
    .nf { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; color: #374151; }
    .nf-code { font-size: 4rem; font-weight: 900; color: #cbd5e1; line-height: 1; }
    .nf h1 { margin: 0.5rem 0 0.25rem; font-size: 1.4rem; color: #1f2937; }
    .nf p { color: #6b7280; margin: 0 0 1.25rem; }
    .nf-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .btn-primary { background: #003087; color: #fff; text-decoration: none; border-radius: 7px; padding: 9px 18px; font-weight: 700; }
    .btn-ghost { background: #fff; color: #374151; border: 1px solid #d1d5db; text-decoration: none; border-radius: 7px; padding: 9px 18px; }
  `],
})
export class NotFound {}
