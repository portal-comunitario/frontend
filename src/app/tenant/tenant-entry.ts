import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TenantService } from './tenant.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-tenant-entry',
  standalone: true,
  template: `<p style="padding:2rem;color:#6b7280">Cargando comunidad…</p>`,
})
export class TenantEntry implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenant = inject(TenantService);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    const prev = this.tenant.getSlug();
    // Cambiar de comunidad cierra la sesión anterior: una sesión pertenece a una comunidad.
    if (prev && prev !== slug) {
      this.auth.clearSession();
    }
    this.tenant.setSlug(slug);
    void this.router.navigate(['/portal']);
  }
}
