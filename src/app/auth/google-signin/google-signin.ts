import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';
import { CredentialResponse } from '../google-identity.types';
import { AuthResponse } from '../models/auth.models';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

@Component({
  selector: 'app-google-signin',
  template: `
    <div #buttonHost class="gsi-button-host"></div>
    @if (loading()) {
      <p class="gsi-status">Iniciando sesión…</p>
    }
    @if (error()) {
      <p class="gsi-error" role="alert">{{ error() }}</p>
    }
  `,
  styles: [
    `
      .gsi-button-host {
        display: inline-block;
        min-height: 40px;
      }
      .gsi-status {
        color: #555;
      }
      .gsi-error {
        color: #b3261e;
      }
    `,
  ],
})
export class GoogleSignin implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  private readonly buttonHost =
    viewChild.required<ElementRef<HTMLElement>>('buttonHost');

  readonly loggedIn = output<AuthResponse>();
  readonly failed = output<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.loadGsiScript();
      this.initialize();
    } catch {
      this.error.set('No se pudo cargar Google Sign-In.');
    }
  }

  private initialize(): void {
    const google = window.google;
    if (!google) {
      this.error.set('Google Sign-In no está disponible.');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      // Google llama este callback fuera de la zona de Angular.
      callback: (res) => this.zone.run(() => this.handleCredential(res)),
      cancel_on_tap_outside: true,
    });

    google.accounts.id.renderButton(this.buttonHost().nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }

  private handleCredential(res: CredentialResponse): void {
    if (!res.credential) {
      this.fail('Google no devolvió credenciales.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.loginWithGoogle(res.credential).subscribe({
      next: (auth) => {
        this.loading.set(false);
        this.loggedIn.emit(auth);
      },
      error: () => {
        this.loading.set(false);
        this.fail('No se pudo autenticar con el servidor.');
      },
    });
  }

  private fail(message: string): void {
    this.error.set(message);
    this.failed.emit(message);
  }

  private loadGsiScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GSI_SRC}"]`,
      );
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('gsi load')));
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('gsi load'));
      document.head.appendChild(script);
    });
  }
}
