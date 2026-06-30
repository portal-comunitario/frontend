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
