import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Evento, EventoRequest } from './evento.models';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.communityApiUrl}/events`;

  getAll(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.base);
  }

  create(request: EventoRequest): Observable<Evento> {
    return this.http.post<Evento>(this.base, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
