import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Carga el SDK de Google Maps una sola vez (idempotente) y resuelve cuando
 * `google.maps` está disponible. Incluye la librería `places` para autocompletar.
 */
@Injectable({ providedIn: 'root' })
export class MapsLoader {
  private promise?: Promise<void>;

  load(): Promise<void> {
    if (this.promise) return this.promise;

    this.promise = new Promise<void>((resolve, reject) => {
      const w = window as unknown as { google?: { maps?: unknown } };
      if (w.google?.maps) { resolve(); return; }

      const existing = document.getElementById('gmaps-sdk') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps')));
        return;
      }

      const key = environment.googleMapsApiKey;
      const script = document.createElement('script');
      script.id = 'gmaps-sdk';
      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${key}` +
        `&libraries=places&language=es-419&region=CL&loading=async`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
      document.head.appendChild(script);
    });

    return this.promise;
  }
}
