export type EventoCategoria = 'GENERAL' | 'CLUB_ADULTO_MAYOR' | 'CENTRO_DE_MADRES' | 'TALLER' | 'REUNION';

export type Frecuencia = 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'ANUAL';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  categoria: EventoCategoria;
  subcategoria: string | null;
  color: string | null;
  agrupacionId: string | null;
  latitud: number | null;
  longitud: number | null;
  recurrente: boolean;
  frecuencia: Frecuencia | null;
  intervalo: number | null;
  recurrenciaFin: string | null;
  authorEmail: string;
  authorNombre: string | null;
  notificadoComunidad: string | null;
  recordatorioEnviado: boolean;
  createdAt: string;
}

export interface EventoRequest {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  categoria?: string;
  subcategoria?: string | null;
  color?: string | null;
  agrupacionId?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  recurrente?: boolean;
  frecuencia?: string | null;
  intervalo?: number | null;
  recurrenciaFin?: string | null;
}
