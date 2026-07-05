export type AvisoCategoria = 'SERVICIO' | 'COMPRA_VENTA' | 'ARRIENDO' | 'PERDIDO_ENCONTRADO';
export type AvisoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Aviso {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: AvisoCategoria;
  authorEmail: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  precio: number | null;
  contacto: string | null;
  estado: AvisoEstado;
  resuelto: boolean;
  createdAt: string;
}

export interface AvisoRequest {
  titulo: string;
  descripcion: string;
  categoria: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string | null;
  precio: number | null;
  contacto: string | null;
}
