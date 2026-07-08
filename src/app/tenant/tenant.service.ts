import { Injectable, signal } from '@angular/core';

const SLUG_KEY = 'tenant.slug';

/** Comunidad (tenant) activa en el navegador. Determina el X-Tenant-ID de las llamadas al API. */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly _slug = signal<string | null>(localStorage.getItem(SLUG_KEY));

  /** Slug de la comunidad activa (null = portal base / public). */
  readonly slug = this._slug.asReadonly();

  setSlug(slug: string | null): void {
    this._slug.set(slug);
    if (slug) {
      localStorage.setItem(SLUG_KEY, slug);
    } else {
      localStorage.removeItem(SLUG_KEY);
    }
  }

  getSlug(): string | null {
    return this._slug();
  }

  /** Nombre legible a partir del slug (villa_el_sol → "Villa El Sol"). */
  nombre(): string | null {
    const s = this._slug();
    if (!s) return null;
    return s.split('_').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
}
