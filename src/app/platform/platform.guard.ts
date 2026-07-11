import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PlatformService } from './platform.service';

export const platformGuard: CanActivateFn = () => {
  const platform = inject(PlatformService);
  const router = inject(Router);
  return platform.isAuthenticated() ? true : router.createUrlTree(['/comunidades/login']);
};
