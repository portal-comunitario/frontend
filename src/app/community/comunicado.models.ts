export type ComunicadoCategoria = 'AVISO' | 'NOTICIA' | 'URGENTE';

export interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  categoria: ComunicadoCategoria;
  imagenUrl: string | null;
  authorEmail: string;
  createdAt: string;
}

export interface ComunicadoRequest {
  titulo: string;
  contenido: string;
  categoria: string;
  imagenUrl: string | null;
}
