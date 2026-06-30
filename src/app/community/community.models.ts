export interface Post {
  id: string;
  titulo: string;
  contenido: string;
  authorEmail: string;
  tipo: 'ANUNCIO' | 'EVENTO' | 'NOTICIA' | 'SERVICIO' | 'COMPRA_VENTA' | 'ARRIENDO' | 'PERDIDO_ENCONTRADO';
  createdAt: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

export interface PostRequest {
  titulo: string;
  contenido: string;
  tipo: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
}

export interface CommunityEvent {
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
