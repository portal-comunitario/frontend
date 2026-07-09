import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MapsLoader {
  private promise?: Promise<void>;

  load(): Promise<void> {
    if (this.promise) return this.promise;

    this.promise = new Promise<void>((resolve, reject) => {
      const ready = () => !!(window as any).google?.maps?.Map;

      // Con `loading=async`, el onload del script puede dispararse antes de que la
      // clase Map esté disponible. Esperamos activamente a que exista de verdad.
      const esperarClases = (intentos = 0) => {
        if (ready()) { resolve(); return; }
        if (intentos > 100) { reject(new Error('Google Maps no terminó de cargar')); return; }
        setTimeout(() => esperarClases(intentos + 1), 50);
      };

      if (ready()) { resolve(); return; }

      const existing = document.getElementById('gmaps-sdk') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps')));
        esperarClases();
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
      script.onload = () => esperarClases();
      script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
      document.head.appendChild(script);
    });

    return this.promise;
  }
}
