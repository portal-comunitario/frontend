export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role?: string;
  tenantId?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface Profile {
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  telefono: string | null;
  rut: string | null;
  direccion: string | null;
  inicioResidencia: string | null;
  estadoValidacion: string;
  notificacionesActivas: boolean;
  accesoAprobado: boolean;
}

export interface ProfileUpdate {
  name: string;
  telefono: string | null;
  notificacionesActivas: boolean;
}

export interface Vecino {
  id: string;
  email: string;
  name: string;
  role: string;
  estadoValidacion: string;
  telefono: string | null;
  rut: string | null;
  direccion: string | null;
  inicioResidencia: string | null;
  accesoAprobado: boolean;
}
