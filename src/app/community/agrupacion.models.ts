export interface Agrupacion {
  id: string;
  nombre: string;
  descripcion: string | null;
  responsable: string | null;
  manejaCuotas: boolean;
  socios: number;
  inscrito: boolean;
  reunionDiaSemana: number | null; // 1=Lunes .. 7=Domingo
  reunionHora: string | null;      // "HH:mm[:ss]"
  pausaInicio: string | null;      // "yyyy-MM-dd"
  pausaFin: string | null;
  reunionesCanceladas: string[];   // fechas "yyyy-MM-dd"
}

export interface AgrupacionRequest {
  nombre: string;
  descripcion: string | null;
  responsable: string | null;
  reunionDiaSemana: number | null;
  reunionHora: string | null;
  pausaInicio: string | null;
  pausaFin: string | null;
}
