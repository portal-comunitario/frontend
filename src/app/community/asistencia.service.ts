import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AsistenciaSocio, MiAsistencia } from './asistencia.models';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.communityApiUrl;

  /** Lista para pasar lista (dirigente): socios con su estado en la actividad. */
  deActividad(eventoId: string): Observable<AsistenciaSocio[]> {
    return this.http.get<AsistenciaSocio[]>(`${this.base}/eventos/${eventoId}/asistencia`);
  }

  /** Guarda la asistencia (dirigente). Devuelve la lista actualizada. */
  marcar(eventoId: string, presentes: string[]): Observable<AsistenciaSocio[]> {
    return this.http.put<AsistenciaSocio[]>(`${this.base}/eventos/${eventoId}/asistencia`, { presentes });
  }

  /** Asistencia del vecino autenticado en una agrupación. */
  mia(agrupacionId: string): Observable<MiAsistencia[]> {
    return this.http.get<MiAsistencia[]>(`${this.base}/agrupaciones/${agrupacionId}/mi-asistencia`);
  }
}
