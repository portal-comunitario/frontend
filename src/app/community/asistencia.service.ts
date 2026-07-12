import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AsistenciaSocio, MiAsistencia, SesionAsistencia } from './asistencia.models';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.communityApiUrl;

  /** Sesiones = ocurrencias de la reunión periódica de la agrupación. */
  sesiones(agrupacionId: string): Observable<SesionAsistencia[]> {
    return this.http.get<SesionAsistencia[]>(`${this.base}/agrupaciones/${agrupacionId}/asistencia/sesiones`);
  }

  deSesion(agrupacionId: string, sesionId: string): Observable<AsistenciaSocio[]> {
    return this.http.get<AsistenciaSocio[]>(`${this.base}/agrupaciones/${agrupacionId}/asistencia/sesiones/${sesionId}`);
  }

  marcarSesion(agrupacionId: string, sesionId: string, presentes: string[]): Observable<AsistenciaSocio[]> {
    return this.http.put<AsistenciaSocio[]>(`${this.base}/agrupaciones/${agrupacionId}/asistencia/sesiones/${sesionId}`, { presentes });
  }

  /** Asistencia por actividad puntual (evento con agrupación). Se mantiene para el panel de actividades. */
  deActividad(eventoId: string): Observable<AsistenciaSocio[]> {
    return this.http.get<AsistenciaSocio[]>(`${this.base}/eventos/${eventoId}/asistencia`);
  }

  marcar(eventoId: string, presentes: string[]): Observable<AsistenciaSocio[]> {
    return this.http.put<AsistenciaSocio[]>(`${this.base}/eventos/${eventoId}/asistencia`, { presentes });
  }

  mia(agrupacionId: string): Observable<MiAsistencia[]> {
    return this.http.get<MiAsistencia[]>(`${this.base}/agrupaciones/${agrupacionId}/mi-asistencia`);
  }
}
