import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, GoogleLoginRequest, Profile, ProfileUpdate, User, Vecino } from './models/auth.models';

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

  /** Registro con correo/contraseña. POST /auth/register -> { token, user } */
  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/register`, { name, email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  /** Login con correo/contraseña. POST /auth/login -> { token, user } */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.authApiUrl}/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  /** Solicita enlace de recuperación. POST /auth/forgot -> { message, resetLink? } */
  forgotPassword(email: string): Observable<{ message: string; resetLink?: string }> {
    return this.http.post<{ message: string; resetLink?: string }>(
      `${environment.authApiUrl}/forgot`,
      { email },
    );
  }

  /** Aplica nueva contraseña con el token. POST /auth/reset -> { message } */
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.authApiUrl}/reset`, { token, password });
  }

  /** Perfil completo del usuario autenticado. GET /auth/me */
  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${environment.authApiUrl}/me`);
  }

  /** Actualiza el perfil. PUT /auth/me. Refresca el nombre en la sesión local. */
  updateProfile(update: ProfileUpdate): Observable<Profile> {
    return this.http.put<Profile>(`${environment.authApiUrl}/me`, update).pipe(
      tap((p) => {
        const current = this._user();
        if (current) {
          const merged = { ...current, name: p.name };
          this._user.set(merged);
          localStorage.setItem(USER_KEY, JSON.stringify(merged));
        }
      }),
    );
  }

  /** Lista de vecinos para gestión (dirigente). GET /auth/vecinos */
  getVecinos(): Observable<Vecino[]> {
    return this.http.get<Vecino[]>(`${environment.authApiUrl}/vecinos`);
  }

  /** Valida la residencia de un vecino. */
  validarVecino(id: string): Observable<Vecino> {
    return this.http.put<Vecino>(`${environment.authApiUrl}/vecinos/${id}/validar`, {});
  }

  /** Revoca la validación (vuelve a pendiente). */
  revocarVecino(id: string): Observable<Vecino> {
    return this.http.put<Vecino>(`${environment.authApiUrl}/vecinos/${id}/revocar`, {});
  }

  /** Edita datos del vecino (nombre, teléfono, dirección, email). */
  updateVecino(id: string, dto: { name: string; telefono: string | null; direccion: string | null; email: string }): Observable<Vecino> {
    return this.http.put<Vecino>(`${environment.authApiUrl}/vecinos/${id}`, dto);
  }

  /** Elimina un vecino (borrado real). */
  deleteVecino(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.authApiUrl}/vecinos/${id}`);
  }

  /** Borra la sesión local y redirige al login. */
  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try { (window as any).google?.accounts?.id?.disableAutoSelect(); } catch { /* Google no cargado o sin sesión previa */ }
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
