import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, GoogleLoginRequest, User } from './models/auth.models';

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(this.readToken());
  private readonly _user = signal<User | null>(this.readUser());

  /** Usuario autenticado actual (reactivo). */
  readonly user = this._user.asReadonly();
  /** True si hay sesión activa. */
  readonly isAuthenticated = computed(() => this._token() !== null);
  /** Rol del usuario extraído del JWT. */
  readonly role = computed(() => this.parseJwtClaim(this._token(), 'role') ?? 'VECINO');
  /** Tenant al que pertenece el usuario (null = sin comunidad asignada). */
  readonly tenantId = computed(() => this.parseJwtClaim(this._token(), 'tenantId'));

  /**
   * Intercambia el ID token de Google por la sesión del backend.
   * POST /auth/google { idToken } -> { token, user }
   */
  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    const body: GoogleLoginRequest = { idToken };
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/google`, body)
      .pipe(tap((res) => this.persistSession(res)));
  }

  /** Borra la sesión local y redirige al login. */
  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.google?.accounts.id.disableAutoSelect();
    void this.router.navigate(['/login']);
  }

  /** Token crudo para adjuntar en cabeceras Authorization. */
  getToken(): string | null {
    return this._token();
  }

  private persistSession(res: AuthResponse): void {
    this._token.set(res.token);
    this._user.set(res.user);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private parseJwtClaim(token: string | null, claim: string): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload[claim] ?? null;
    } catch {
      return null;
    }
  }
}
