import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AvisoService } from '../../community/aviso.service';
import { AuthService } from '../../auth/auth.service';
import { CertificadoService } from '../../certificado/certificado.service';
import { environment } from '../../../environments/environment';

/** Administración — hub: tarjetas que abren cada gestión en su propia página. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <h1>Administración</h1>
    <p>Panel de gestión de la comunidad {{ communityName }}. Elige una sección.</p>
  </div>
</section>

<div class="content-area">
  <div class="admin-hub">

    <a class="hub-card" routerLink="/portal/admin/moderacion">
      <div class="hub-ico">🛡️</div>
      <div class="hub-body">
        <h3>Moderación de avisos</h3>
        <p>Revisa y aprueba las publicaciones del tablón vecinal.</p>
      </div>
      <span class="hub-badge" [class.cero]="avisosPend() === 0">{{ avisosPend() }}</span>
    </a>

    <a class="hub-card" routerLink="/portal/admin/vecinos">
      <div class="hub-ico">👥</div>
      <div class="hub-body">
        <h3>Gestión de vecinos</h3>
        <p>Valida residencia, edita o elimina vecinos de la comunidad.</p>
      </div>
      <span class="hub-badge" [class.cero]="vecinosPend() === 0">{{ vecinosPend() }}</span>
    </a>

    <a class="hub-card" routerLink="/portal/admin/certificados">
      <div class="hub-ico">📄</div>
      <div class="hub-body">
        <h3>Certificados de residencia</h3>
        <p>Aprueba o rechaza las solicitudes de certificado.</p>
      </div>
      <span class="hub-badge" [class.cero]="certPend() === 0">{{ certPend() }}</span>
    </a>

  </div>
</div>
  `,
  styles: [`
    .admin-hub { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
    .hub-card { position: relative; display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 1.25rem; text-decoration: none; color: inherit; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: box-shadow 0.15s, transform 0.15s; }
    .hub-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .hub-ico { font-size: 2rem; flex-shrink: 0; }
    .hub-body h3 { margin: 0 0 0.25rem; font-size: 1rem; color: #1f2937; }
    .hub-body p { margin: 0; font-size: 0.84rem; color: #6b7280; }
    .hub-badge { position: absolute; top: 12px; right: 12px; min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; background: #dc2626; color: #fff; font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .hub-badge.cero { background: #d1d5db; }
  `],
})
export class Admin implements OnInit {
  private readonly avisoSvc = inject(AvisoService);
  private readonly auth = inject(AuthService);
  private readonly cert = inject(CertificadoService);
  protected readonly communityName = environment.communityName;

  avisosPend = signal(0);
  vecinosPend = signal(0);
  certPend = signal(0);

  ngOnInit(): void {
    this.avisoSvc.getPendientes().subscribe({ next: (d) => this.avisosPend.set(d.length) });
    this.auth.getVecinos().subscribe({ next: (d) => this.vecinosPend.set(d.filter((v) => !v.accesoAprobado).length) });
    this.cert.pendientes().subscribe({ next: (d) => this.certPend.set(d.length) });
  }
}
