import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TenantService } from './tenant.service';

/** Punto de entrada de una comunidad: fija el tenant activo (slug) y entra al portal. */
@Component({
  selector: 'app-tenant-entry',
  standalone: true,
  template: `<p style="padding:2rem;color:#6b7280">Cargando comunidad…</p>`,
})
export class TenantEntry implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenant = inject(TenantService);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.tenant.setSlug(slug);
    void this.router.navigate(['/portal']);
  }
}
