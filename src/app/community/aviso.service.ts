import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Aviso, AvisoRequest } from './aviso.models';

@Injectable({ providedIn: 'root' })
export class AvisoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.communityApiUrl}/avisos`;

  getAll(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(this.base);
  }

  getPendientes(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(`${this.base}/pendientes`);
  }

  create(request: AvisoRequest): Observable<Aviso> {
    return this.http.post<Aviso>(this.base, request);
  }

  update(id: string, request: AvisoRequest): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${id}`, request);
  }

  aprobar(id: string): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${id}/aprobar`, {});
  }

  rechazar(id: string): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${id}/rechazar`, {});
  }

  marcarResuelto(id: string): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${id}/resuelto`, {});
  }

  reabrir(id: string): Observable<Aviso> {
    return this.http.put<Aviso>(`${this.base}/${id}/reabrir`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
