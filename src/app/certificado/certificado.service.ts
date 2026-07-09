import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { SolicitudCertificado } from './certificado.models';

@Injectable({ providedIn: 'root' })
export class CertificadoService {
  private readonly http = inject(HttpClient);
  // Los endpoints de certificados viven en la raíz de ms-auth (no bajo /auth).
  private readonly base = environment.authApiUrl.replace(/\/auth$/, '') + '/certificados';

  crear(motivo: string, rut: string, direccion: string, cedula: File, comprobante: File): Observable<SolicitudCertificado> {
    const fd = new FormData();
    fd.append('motivo', motivo ?? '');
    fd.append('rut', rut ?? '');
    fd.append('direccion', direccion ?? '');
    fd.append('cedula', cedula);
    fd.append('comprobante', comprobante);
    return this.http.post<SolicitudCertificado>(this.base, fd);
  }

  mias(): Observable<SolicitudCertificado[]> {
    return this.http.get<SolicitudCertificado[]>(`${this.base}/mias`);
  }

  pendientes(): Observable<SolicitudCertificado[]> {
    return this.http.get<SolicitudCertificado[]>(`${this.base}/pendientes`);
  }

  aprobar(id: string): Observable<SolicitudCertificado> {
    return this.http.put<SolicitudCertificado>(`${this.base}/${id}/aprobar`, {});
  }

  rechazar(id: string, motivo: string): Observable<SolicitudCertificado> {
    return this.http.put<SolicitudCertificado>(`${this.base}/${id}/rechazar`, { motivo });
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  abrirArchivo(id: string, tipo: 'cedula' | 'comprobante' | 'pdf'): void {
    this.http.get(`${this.base}/${id}/archivo/${tipo}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
    });
  }
}
