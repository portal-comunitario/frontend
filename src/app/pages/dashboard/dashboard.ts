import { Component, inject } from '@angular/core';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <main class="dashboard">
      @if (auth.user(); as user) {
        <header>
          @if (user.picture) {
            <img [src]="user.picture" [alt]="user.name" width="48" height="48" />
          }
          <div>
            <h1>Hola, {{ user.name }}</h1>
            <p>{{ user.email }}</p>
          </div>
        </header>
      }
      <button type="button" (click)="auth.logout()">Cerrar sesión</button>
    </main>
  `,
  styles: [
    `
      .dashboard {
        max-width: 480px;
        margin: 3rem auto;
        font-family: system-ui, sans-serif;
      }
      header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      img {
        border-radius: 50%;
      }
    `,
  ],
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
