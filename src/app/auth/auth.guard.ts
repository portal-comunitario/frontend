import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Guardamos el destino en memoria (no en la URL) para que quede limpia: /login
  auth.setRedirectUrl(state.url);
  return router.createUrlTree(['/login']);
};
