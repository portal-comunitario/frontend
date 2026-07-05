import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Comunicado, ComunicadoRequest } from './comunicado.models';

@Injectable({ providedIn: 'root' })
export class ComunicadoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.communityApiUrl}/comunicados`;

  getAll(): Observable<Comunicado[]> {
    return this.http.get<Comunicado[]>(this.base);
  }

  create(request: ComunicadoRequest): Observable<Comunicado> {
    return this.http.post<Comunicado>(this.base, request);
  }

  update(id: string, request: ComunicadoRequest): Observable<Comunicado> {
    return this.http.put<Comunicado>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
