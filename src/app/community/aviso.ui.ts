import { AvisoCategoria } from './aviso.models';

export const AVISO_COLORS: Record<string, string> = {
  SERVICIO: '#8b5cf6',
  COMPRA_VENTA: '#f97316',
  ARRIENDO: '#06b6d4',
  PERDIDO_ENCONTRADO: '#ec4899',
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
  { value: 'SERVICIO', label: 'Servicios', color: '#8b5cf6' },
  { value: 'COMPRA_VENTA', label: 'Compra/Venta', color: '#f97316' },
  { value: 'ARRIENDO', label: 'Arriendos', color: '#06b6d4' },
  { value: 'PERDIDO_ENCONTRADO', label: 'Perdidos', color: '#ec4899' },
];
