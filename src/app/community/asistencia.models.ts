export interface AsistenciaSocio {
  email: string;
  presente: boolean;
}

export interface MiAsistencia {
  eventoId: string;
  presente: boolean;
}

/** Ocurrencia de la reunión periódica sobre la que se pasa lista. */
export interface SesionAsistencia {
  sesionId: string;
  fecha: string;   // ISO date (yyyy-MM-dd)
  hora: string;    // "HH:mm" o ""
}
