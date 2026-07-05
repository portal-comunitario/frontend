/** Usuario autenticado devuelto por el backend. */
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role?: string;
  tenantId?: string | null;
}

/** Respuesta de POST /auth/google. */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Cuerpo enviado a POST /auth/google. */
export interface GoogleLoginRequest {
  idToken: string;
}

/** Perfil completo del vecino (GET /auth/me). */
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
}

/** Campos editables del perfil (PUT /auth/me). */
export interface ProfileUpdate {
  name: string;
  telefono: string | null;
  rut: string | null;
  direccion: string | null;
  inicioResidencia: string | null;
}
