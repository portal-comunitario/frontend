import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { AsistenciaSocio, MiAsistencia } from './asistencia.models';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.communityApiUrl;

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
