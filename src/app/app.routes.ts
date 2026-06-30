import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/posts/posts').then((m) => m.Posts),
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events').then((m) => m.Events),
  },
  { path: '**', redirectTo: 'dashboard' },
];
