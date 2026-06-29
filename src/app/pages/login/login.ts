import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { GoogleSignin } from '../../auth/google-signin/google-signin';
import { AuthResponse } from '../../auth/models/auth.models';

@Component({
  selector: 'app-login',
  imports: [GoogleSignin],
  template: `
    <main class="login">
      <h1>Portal Comunitario</h1>
      <p>Inicia sesión para continuar.</p>
      <app-google-signin (loggedIn)="onLoggedIn($event)" />
    </main>
  `,
  styles: [
    `
      .login {
        max-width: 360px;
        margin: 4rem auto;
        text-align: center;
        font-family: system-ui, sans-serif;
      }
    `,
  ],
})
export class Login {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  onLoggedIn(_auth: AuthResponse): void {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }
}
