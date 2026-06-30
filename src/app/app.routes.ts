import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'portal', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'portal',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/portal/portal').then((m) => m.Portal),
  },
  // Rutas legacy redirigen al portal
  { path: 'dashboard', redirectTo: 'portal' },
  { path: 'posts', redirectTo: 'portal' },
  { path: 'events', redirectTo: 'portal' },
  { path: '**', redirectTo: 'portal' },
];
