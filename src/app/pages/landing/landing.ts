import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Entrada institucional del sistema (root `/`). Representa la cara municipal del
 * Portal Comunitario: su acción principal es el acceso del equipo municipal a la
 * gestión de comunidades (`/comunidades`). Los vecinos NO entran por aquí — llegan
 * al portal de su comunidad por el enlace directo (`/c/:slug`, o subdominio en prod).
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="landing">
      <div class="card">
        <div class="head">
          <div class="logo">🏘️</div>
          <h1>Portal Comunitario</h1>
          <p>Plataforma municipal de gestión de juntas de vecinos</p>
        </div>
        <div class="body">
          <p class="lead">
            Crea y administra las comunidades de la comuna: vecinos, avisos, eventos,
            agrupaciones y certificados de residencia, todo en un solo lugar.
          </p>
          <button class="primary" (click)="irAComunidades()">
            Acceso administración municipal
          </button>
          <p class="hint">
            ¿Eres vecino/a? Ingresa al portal de tu comunidad con el enlace que te
            compartió tu junta de vecinos.
          </p>
        </div>
      </div>
      <footer>© 2026 Portal Comunitario</footer>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1.25rem; padding: 2rem 1rem;
      background: radial-gradient(1200px 600px at 50% -10%, #eaf0fb 0%, #f5f7fb 60%); }
    .card { width: 100%; max-width: 440px; background: #fff; border-radius: 18px; overflow: hidden;
      box-shadow: 0 12px 40px rgba(0, 48, 135, .12); border: 1px solid #e8ecf5; }
    .head { background: linear-gradient(135deg, #003087 0%, #0a4bb3 100%); color: #fff;
      text-align: center; padding: 2.25rem 1.5rem 1.75rem; }
    .head .logo { font-size: 2.5rem; line-height: 1; }
    .head h1 { margin: .6rem 0 .25rem; font-size: 1.6rem; font-weight: 800; letter-spacing: -.01em; }
    .head p { margin: 0; font-size: .9rem; color: #cdd9f2; }
    .body { padding: 1.75rem 1.6rem 2rem; text-align: center; }
    .lead { margin: 0 0 1.4rem; color: #4b5563; font-size: .95rem; line-height: 1.5; }
    .primary { width: 100%; padding: .85rem 1rem; border: none; border-radius: 10px;
      background: #003087; color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer;
      transition: filter .15s ease; }
    .primary:hover { filter: brightness(1.08); }
    .hint { margin: 1.4rem 0 0; padding-top: 1.2rem; border-top: 1px solid #eef1f7;
      color: #9099a8; font-size: .82rem; line-height: 1.45; }
    footer { color: #a2abbb; font-size: .8rem; }
  `],
})
export class Landing {
  private readonly router = inject(Router);

  irAComunidades(): void {
    void this.router.navigate(['/comunidades']);
  }
}
