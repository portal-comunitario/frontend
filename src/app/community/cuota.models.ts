export type Periodicidad = 'SEMANAL' | 'MENSUAL';

export interface CuotaPeriodo {
  id: string;
  monto: number;
  periodicidad: Periodicidad;
  fechaInicio: string;
  fechaFin: string;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface Cuota {
  id: string;
  vecinoEmail: string;
  etiqueta: string;
  monto: number;
  vencimiento: string;
  pagada: boolean;
  vencida: boolean;
}

export interface CuotaActivarRequest {
  monto: number;
  periodicidad: string;
  fechaInicio: string;
  fechaFin: string;
}
