import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Cuota, CuotaActivarRequest, CuotaPeriodo } from './cuota.models';

@Injectable({ providedIn: 'root' })
export class CuotaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.communityApiUrl;

  periodo(agrupacionId: string): Observable<CuotaPeriodo | null> {
    return this.http.get<CuotaPeriodo | null>(`${this.base}/agrupaciones/${agrupacionId}/cuotas/periodo`);
  }

  activar(agrupacionId: string, req: CuotaActivarRequest): Observable<CuotaPeriodo> {
    return this.http.post<CuotaPeriodo>(`${this.base}/agrupaciones/${agrupacionId}/cuotas/activar`, req);
  }

  cerrar(agrupacionId: string): Observable<CuotaPeriodo> {
    return this.http.put<CuotaPeriodo>(`${this.base}/agrupaciones/${agrupacionId}/cuotas/cerrar`, {});
  }

  /** Corrige el monto del período abierto (se propaga a las cuotas no pagadas). */
  actualizarMonto(agrupacionId: string, monto: number): Observable<CuotaPeriodo> {
    return this.http.put<CuotaPeriodo>(`${this.base}/agrupaciones/${agrupacionId}/cuotas/monto`, { monto });
  }

  todas(agrupacionId: string): Observable<Cuota[]> {
    return this.http.get<Cuota[]>(`${this.base}/agrupaciones/${agrupacionId}/cuotas`);
  }

  mias(agrupacionId: string): Observable<Cuota[]> {
    return this.http.get<Cuota[]>(`${this.base}/agrupaciones/${agrupacionId}/cuotas/mias`);
  }

  pagar(cuotaId: string): Observable<Cuota> {
    return this.http.put<Cuota>(`${this.base}/cuotas/${cuotaId}/pagar`, {});
  }

  pendiente(cuotaId: string): Observable<Cuota> {
    return this.http.put<Cuota>(`${this.base}/cuotas/${cuotaId}/pendiente`, {});
  }
}
