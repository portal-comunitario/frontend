import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * Entrada neutral del sistema (root `/`). No asume ninguna comunidad: separa las
 * dos audiencias del portal multi-tenant — vecinos (van a su comunidad `/c/:slug`)
 * y administración municipal (van a `/platform`).
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="landing">
      <div class="hero">
        <div class="logo">🏘️</div>
        <h1>Portal Comunitario</h1>
        <p class="tagline">Juntas de vecinos conectadas. Elige cómo quieres ingresar.</p>
      </div>

      <div class="cards">
        <section class="card">
          <h2>Soy vecino/a</h2>
          <p>Ingresa a tu comunidad con el identificador que te compartió tu junta de vecinos.</p>
          <label for="slug">Identificador de tu comunidad</label>
          <input id="slug" name="slug" type="text" [(ngModel)]="slugInput"
                 placeholder="ej: villa_las_flores" (keyup.enter)="irAComunidad()" />
          @if (error()) { <div class="err">Ingresa un identificador válido.</div> }
          <button class="primary" (click)="irAComunidad()">Ingresar a mi comunidad</button>
        </section>

        <section class="card">
          <h2>Administración municipal</h2>
          <p>Acceso del equipo municipal para crear y administrar las comunidades de la plataforma.</p>
          <button class="secondary" (click)="irAPlataforma()">Ir a la plataforma</button>
        </section>
      </div>

      <footer>© 2026 Portal Comunitario</footer>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 2rem; padding: 2rem 1rem; background: #f5f7fb; }
    .hero { text-align: center; }
    .logo { font-size: 2.75rem; }
    h1 { margin: .5rem 0 .25rem; font-size: 1.9rem; font-weight: 800; color: #003087; }
    .tagline { margin: 0; color: #6b7280; }
    .cards { display: flex; flex-wrap: wrap; gap: 1.25rem; justify-content: center; width: 100%; max-width: 760px; }
    .card { flex: 1 1 320px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
      padding: 1.5rem; display: flex; flex-direction: column; gap: .6rem; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
    .card h2 { margin: 0; font-size: 1.15rem; color: #003087; }
    .card p { margin: 0 0 .3rem; color: #4b5563; font-size: .92rem; }
    label { font-size: .78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .02em; }
    input { padding: .6rem .7rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: .95rem; }
    .err { color: #b91c1c; font-size: .8rem; }
    button { margin-top: .4rem; padding: .7rem; border: none; border-radius: 8px; font-weight: 700;
      font-size: .95rem; cursor: pointer; }
    .primary { background: #003087; color: #fff; }
    .secondary { background: #eef2ff; color: #003087; border: 1px solid #c7d2fe; }
    button:hover { filter: brightness(.97); }
    footer { color: #9ca3af; font-size: .8rem; }
  `],
})
export class Landing {
  private readonly router = inject(Router);
  protected slugInput = '';
  protected readonly error = signal(false);

  irAComunidad(): void {
    const slug = this.slugInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!slug) { this.error.set(true); return; }
    this.error.set(false);
    void this.router.navigate(['/c', slug]);
  }

  irAPlataforma(): void {
    void this.router.navigate(['/platform']);
  }
}
