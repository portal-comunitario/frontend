export interface Post {
  id: string;
  titulo: string;
  contenido: string;
  authorEmail: string;
  tipo: 'ANUNCIO' | 'EVENTO' | 'NOTICIA';
  createdAt: string;
}

export interface PostRequest {
  titulo: string;
  contenido: string;
  tipo: string;
}

export interface Event {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
  authorEmail: string;
  createdAt: string;
}

export interface EventRequest {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  ubicacion: string | null;
}
