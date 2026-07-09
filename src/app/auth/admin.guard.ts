import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();
  if (role === 'COMMUNITY_ADMIN' || role === 'PLATFORM_ADMIN') {
    return true;
  }
  return router.createUrlTree(['/portal']);
};
