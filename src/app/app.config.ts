import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { tenantInterceptor } from './tenant/tenant.interceptor';

registerLocaleData(localeEsCL);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, tenantInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CL' }
  ]
};
