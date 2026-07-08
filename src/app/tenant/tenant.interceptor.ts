import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { TenantService } from './tenant.service';
import { environment } from '../../environments/environment';

/**
 * Adjunta X-Tenant-ID (slug de la comunidad activa) a las llamadas de auth y community,
 * para que el backend enrute al schema correcto. No toca las llamadas de plataforma (ms-tenant).
 */
export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const slug = inject(TenantService).getSlug();
  const isApi = req.url.startsWith(environment.authApiUrl) || req.url.startsWith(environment.communityApiUrl);

  if (!slug || !isApi) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Tenant-ID': slug } }));
};
