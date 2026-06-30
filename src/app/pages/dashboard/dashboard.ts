import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <!-- Header con info del usuario -->
      @if (auth.user(); as user) {
        <header class="header">
          <div class="user-info">
            @if (user.picture) {
              <img [src]="user.picture" [alt]="user.name" width="48" height="48" />
            }
            <div>
              <h1>Hola, {{ user.name }}</h1>
              <p class="muted">{{ user.email }}</p>
            </div>
          </div>
          <button class="btn-outline" (click)="auth.logout()">Cerrar sesión</button>
        </header>
      }

      <!-- Tarjetas de navegación -->
      <section class="grid">
        <a routerLink="/posts" class="nav-card">
          <div class="icon">📋</div>
          <h2>Publicaciones</h2>
          <p>Anuncios, noticias y novedades del barrio</p>
        </a>
        <a routerLink="/events" class="nav-card">
          <div class="icon">📅</div>
          <h2>Eventos</h2>
          <p>Actividades y reuniones de la comunidad</p>
        </a>
      </section>
    </div>
  `,
  styles: [`
    .container { max-width: 700px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .user-info img { border-radius: 50%; }
    h1 { margin: 0; font-size: 1.4rem; }
    .muted { margin: 0; color: #9ca3af; font-size: 0.9rem; }
    .btn-outline { border: 1px solid #d1d5db; background: #fff; border-radius: 6px; padding: 8px 16px; cursor: pointer; font-size: 0.9rem; }
    .btn-outline:hover { background: #f9fafb; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .nav-card { display: block; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.5rem; text-decoration: none; color: inherit; transition: box-shadow 0.15s, border-color 0.15s; }
    .nav-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #6366f1; }
    .icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .nav-card h2 { margin: 0 0 0.4rem; font-size: 1.1rem; }
    .nav-card p { margin: 0; color: #6b7280; font-size: 0.88rem; }
  `]
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
