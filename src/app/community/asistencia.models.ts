/** Un socio y su estado de asistencia a una actividad (vista del dirigente). */
export interface AsistenciaSocio {
  email: string;
  presente: boolean;
}

/** Asistencia del propio vecino a una actividad de la agrupación. */
export interface MiAsistencia {
  eventoId: string;
  presente: boolean;
}
