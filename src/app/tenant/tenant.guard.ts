import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TenantService } from './tenant.service';

/**
 * Exige que haya una comunidad (tenant) activa. Las rutas de vecinos (`/portal`,
 * `/login`) no tienen sentido sin tenant: si no hay slug, se vuelve al landing.
 * Esto evita el portal "por defecto" (herencia single-tenant).
 */
export const tenantGuard: CanActivateFn = () => {
  const tenant = inject(TenantService);
  const router = inject(Router);
  return tenant.getSlug() ? true : router.createUrlTree(['/']);
};
