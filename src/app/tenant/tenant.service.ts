import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

const SLUG_KEY = 'tenant.slug';
const META_KEY = 'tenant.meta';

export interface TenantMeta {
  nombre: string;
  comuna: string | null;
  slug: string;
  sedeNombre: string | null;
  sedeDireccion: string | null;
}

/** Comunidad (tenant) activa en el navegador. Determina el X-Tenant-ID de las llamadas al API. */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);

  private readonly _slug = signal<string | null>(localStorage.getItem(SLUG_KEY));
  private readonly _meta = signal<TenantMeta | null>(this.readMeta());

  /** Slug de la comunidad activa (null = portal base / public). */
  readonly slug = this._slug.asReadonly();
  readonly meta = this._meta.asReadonly();

  constructor() {
    const s = this._slug();
    if (s) this.loadMeta(s);
  }

  setSlug(slug: string | null): void {
    this._slug.set(slug);
    if (slug) {
      localStorage.setItem(SLUG_KEY, slug);
      this.loadMeta(slug);
    } else {
      localStorage.removeItem(SLUG_KEY);
      this._meta.set(null);
      localStorage.removeItem(META_KEY);
    }
  }

  getSlug(): string | null {
    return this._slug();
  }

  /** Nombre legible de la comunidad. Prefiere la metadata del backend; si no, deriva del slug. */
  nombre(): string | null {
    const m = this._meta();
    if (m?.nombre) return m.nombre;
    const s = this._slug();
    if (!s) return null;
    return s.split('_').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  /** Sede de la comunidad activa (para centrar el mapa y el retiro de certificados). */
  readonly sede = computed(() => {
    const m = this._meta();
    if (!m?.sedeDireccion) return null;
    return { nombre: m.sedeNombre ?? `Sede ${m.nombre}`, direccion: m.sedeDireccion };
  });

  private loadMeta(slug: string): void {
    this.http.get<TenantMeta>(`${environment.tenantApiUrl}/public/comunidades/${slug}`).subscribe({
      next: (m) => { this._meta.set(m); localStorage.setItem(META_KEY, JSON.stringify(m)); },
      error: () => { /* comunidad desconocida o ms-tenant abajo: se cae al nombre derivado del slug */ },
    });
  }

  private readMeta(): TenantMeta | null {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as TenantMeta; } catch { return null; }
  }
}
