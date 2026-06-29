import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Adjunta el token de sesión como Bearer en las peticiones salientes.
 * Se omite la propia llamada de login (que aún no tiene token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const isLoginCall = req.url === `${environment.authApiUrl}/google`;

  if (!token || isLoginCall) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
