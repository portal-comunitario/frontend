import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Agrupacion, AgrupacionRequest } from './agrupacion.models';

@Injectable({ providedIn: 'root' })
export class AgrupacionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.communityApiUrl}/agrupaciones`;

  getAll(): Observable<Agrupacion[]> {
    return this.http.get<Agrupacion[]>(this.base);
  }

  create(request: AgrupacionRequest): Observable<Agrupacion> {
    return this.http.post<Agrupacion>(this.base, request);
  }

  update(id: string, request: AgrupacionRequest): Observable<Agrupacion> {
    return this.http.put<Agrupacion>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  inscribirse(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/inscribirse`, {});
  }

  salir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/inscribirse`);
  }

  socios(id: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/${id}/socios`);
  }

  cancelarReunion(id: string, fecha: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reuniones/cancelar`, { fecha });
  }

  reactivarReunion(id: string, fecha: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/reuniones/cancelar?fecha=${fecha}`);
  }
}
