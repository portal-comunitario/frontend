export type EventoCategoria = 'GENERAL' | 'CLUB_ADULTO_MAYOR' | 'CENTRO_DE_MADRES' | 'TALLER' | 'REUNION';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  categoria: EventoCategoria;
  agrupacionId: string | null;
  authorEmail: string;
  createdAt: string;
}

export interface EventoRequest {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  categoria: string;
  agrupacionId?: string | null;
}
