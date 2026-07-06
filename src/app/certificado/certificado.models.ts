export type EstadoCertificado = 'SOLICITADO' | 'EMITIDO' | 'RECHAZADO';

export interface SolicitudCertificado {
  id: string;
  vecinoEmail: string;
  vecinoNombre: string | null;
  motivo: string | null;
  rut: string | null;
  direccion: string | null;
  estado: EstadoCertificado;
  folio: string | null;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  fechaVencimiento: string | null;
  tienePdf: boolean;
}
