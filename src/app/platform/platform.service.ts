import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ComunidadPlatform {
  id: string;
  nombre: string;
  comuna: string | null;
  slug: string;
  codigo: string;
  adminEmail: string;
  estado: string;
  url: string;
  sedeNombre: string | null;
  sedeDireccion: string | null;
}

const TOKEN_KEY = 'platform.token';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = environment.tenantApiUrl;

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isAuthenticated = computed(() => this._token() !== null);

  login(email: string, password: string): Observable<{ token: string; email: string; role: string }> {
    return this.http
      .post<{ token: string; email: string; role: string }>(`${this.base}/platform/login`, { email, password })
      .pipe(tap((res) => {
        this._token.set(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
      }));
  }

  logout(): void {
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    void this.router.navigate(['/comunidades/login']);
  }

  listar(): Observable<ComunidadPlatform[]> {
    return this.http.get<ComunidadPlatform[]>(`${this.base}/platform/comunidades`, { headers: this.authHeaders() });
  }

  crear(dto: { nombre: string; comuna: string | null; adminEmail: string; sedeDireccion: string; sedeNombre?: string | null }): Observable<ComunidadPlatform> {
    return this.http.post<ComunidadPlatform>(`${this.base}/platform/comunidades`, dto, { headers: this.authHeaders() });
  }

  actualizar(id: string, dto: { nombre: string; comuna: string | null; adminEmail: string; sedeDireccion: string; sedeNombre?: string | null }): Observable<ComunidadPlatform> {
    return this.http.put<ComunidadPlatform>(`${this.base}/platform/comunidades/${id}`, dto, { headers: this.authHeaders() });
  }

  cambiarEstado(id: string, estado: string): Observable<ComunidadPlatform> {
    return this.http.put<ComunidadPlatform>(`${this.base}/platform/comunidades/${id}/estado`, { estado }, { headers: this.authHeaders() });
  }

  getToken(): string | null {
    return this._token();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this._token() ?? ''}` });
  }
}
