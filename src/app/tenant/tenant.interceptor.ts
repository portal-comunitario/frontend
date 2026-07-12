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
  // Raíz de ms-auth SIN el sufijo /auth, para cubrir también /certificados y /contactos
  // (antes solo matcheaba authApiUrl='/api-auth/auth' y dejaba esos endpoints sin X-Tenant-ID → 403).
  const authRoot = environment.authApiUrl.replace(/\/auth$/, '');
  const isApi = req.url.startsWith(authRoot) || req.url.startsWith(environment.communityApiUrl);

  if (!slug || !isApi) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Tenant-ID': slug } }));
};
