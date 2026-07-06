import { AvisoCategoria } from './aviso.models';

export const AVISO_COLORS: Record<string, string> = {
  SERVICIO: '#2563eb',            // azul
  COMPRA_VENTA: '#f97316',        // naranja
  ARRIENDO: '#16a34a',            // verde
  PERDIDO_ENCONTRADO: '#dc2626',  // rojo
};

export const AVISO_LABELS: Record<string, string> = {
  SERVICIO: 'Servicio',
  COMPRA_VENTA: 'Compra y Venta',
  ARRIENDO: 'Arriendo',
  PERDIDO_ENCONTRADO: 'Perdido / Encontrado',
};

export interface AvisoFiltro { value: 'TODOS' | AvisoCategoria; label: string; color?: string; }

export const AVISO_FILTROS: AvisoFiltro[] = [
  { value: 'TODOS', label: 'Todos', color: '#003087' },
  { value: 'SERVICIO', label: 'Servicios', color: '#2563eb' },
  { value: 'COMPRA_VENTA', label: 'Compra/Venta', color: '#f97316' },
  { value: 'ARRIENDO', label: 'Arriendos', color: '#16a34a' },
  { value: 'PERDIDO_ENCONTRADO', label: 'Perdidos', color: '#dc2626' },
];
