import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { TenantService } from '../../tenant/tenant.service';
import { environment } from '../../../environments/environment';

/**
 * Shell del portal: cabecera, navegación por secciones y <router-outlet>.
 * Cada sección es un componente hijo (features/*). Ver DISEÑO-PORTAL.md §3 y §7.
 */
@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="site-wrapper">
  <header class="site-header">
    <div class="site-header-inner">
      <div class="site-logo">
        <span class="logo-icon">🏘️</span>
        <div>
          <div class="logo-title">{{ tenant.nombre() ?? communityName }}</div>
          <div class="logo-sub">Portal Comunitario</div>
        </div>
      </div>
      @if (auth.user(); as user) {
        <div class="header-user">
          <a class="header-user-link" routerLink="/portal/perfil" title="Mi perfil">
            @if (user.picture) { <img [src]="user.picture" class="user-avatar" alt="" /> }
            <span class="user-name-header">{{ user.name }}</span>
          </a>
          <button class="btn-logout" (click)="auth.logout()">Salir</button>
        </div>
      }
    </div>
  </header>

  <nav class="site-nav">
    <div class="site-nav-inner">
      <a class="nav-tab" routerLink="/portal" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">INICIO</a>
      <a class="nav-tab" routerLink="/portal/tablon" routerLinkActive="active">AVISOS</a>
      <a class="nav-tab" routerLink="/portal/mapa" routerLinkActive="active">MAPA</a>
      <a class="nav-tab" routerLink="/portal/eventos" routerLinkActive="active">EVENTOS</a>
      <a class="nav-tab" routerLink="/portal/agrupaciones" routerLinkActive="active">AGRUPACIONES</a>
      <a class="nav-tab" routerLink="/portal/calendario" routerLinkActive="active">CALENDARIO</a>
      <a class="nav-tab" routerLink="/portal/tramites" routerLinkActive="active">TRÁMITES</a>
      @if (isAdmin()) {
        <a class="nav-tab" routerLink="/portal/admin" routerLinkActive="active">ADMINISTRACIÓN</a>
      }
      <a class="nav-tab nav-tab-perfil" routerLink="/portal/perfil" routerLinkActive="active">MI PERFIL</a>
    </div>
  </nav>

  @if (auth.enRevision()) {
    <div class="revision-banner">
      <span>🔎 Tu cuenta está <strong>en revisión</strong>. Puedes navegar el portal, pero no publicar ni inscribirte hasta que la directiva apruebe tu acceso.</span>
    </div>
  }

  <main class="site-main">
    <router-outlet />
  </main>

  <footer class="site-footer">
    <div class="site-footer-inner">
      <span>© 2026 Portal Comunitario {{ communityName }}</span>
      <span>Taller Aplicado de Software · Duoc UC</span>
    </div>
  </footer>
</div>
  `,
})
export class Portal {
  protected readonly auth = inject(AuthService);
  protected readonly tenant = inject(TenantService);
  protected readonly communityName = environment.communityName;
  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };
}
