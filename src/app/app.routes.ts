import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

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
    children: [
      { path: '', loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio) },
      { path: 'tablon', loadComponent: () => import('./features/tablon/tablon').then((m) => m.Tablon) },
      { path: 'mapa', loadComponent: () => import('./features/mapa/mapa').then((m) => m.Mapa) },
      { path: 'eventos', loadComponent: () => import('./features/eventos/eventos').then((m) => m.Eventos) },
      { path: 'agrupaciones', loadComponent: () => import('./features/agrupaciones/agrupaciones').then((m) => m.Agrupaciones) },
      { path: 'agrupaciones/:id/cuotas', loadComponent: () => import('./features/cuotas/cuotas-page').then((m) => m.CuotasPage) },
      { path: 'agrupaciones/:id/asistencia', loadComponent: () => import('./features/asistencia/asistencia-page').then((m) => m.AsistenciaPage) },
      { path: 'calendario', loadComponent: () => import('./features/calendario/calendario').then((m) => m.Calendario) },
      { path: 'tramites', loadComponent: () => import('./features/tramites/tramites').then((m) => m.Tramites) },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin').then((m) => m.Admin) },
      { path: 'admin/moderacion', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-moderacion').then((m) => m.AdminModeracion) },
      { path: 'admin/vecinos', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-vecinos').then((m) => m.AdminVecinos) },
      { path: 'admin/certificados', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-certificados').then((m) => m.AdminCertificados) },
      { path: 'perfil', loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },
    ],
  },
  {
    path: 'reset',
    loadComponent: () => import('./pages/reset/reset').then((m) => m.Reset),
  },
  // Rutas legacy redirigen al portal
  { path: 'dashboard', redirectTo: 'portal' },
  { path: 'posts', redirectTo: 'portal/tablon' },
  { path: 'events', redirectTo: 'portal/eventos' },
  { path: '**', redirectTo: 'portal' },
];
