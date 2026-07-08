import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ComunidadPlatform, PlatformService } from './platform.service';

/** Panel de la municipalidad: alta y administración de comunidades. */
@Component({
  selector: 'app-platform-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
<header class="pp-header">
  <div class="pp-header-inner">
    <span class="pp-title">🏛️ Plataforma de Comunidades</span>
    <button class="pp-logout" (click)="platform.logout()">Salir</button>
  </div>
</header>

<div class="pp-body">
  <div class="pp-grid">

    <div class="pp-card pp-form">
      <h2>Nueva comunidad</h2>
      <p class="pp-hint">Al crearla se genera su portal aislado y se asocia al administrador indicado.</p>
      <form (ngSubmit)="crear()" #f="ngForm">
        <div class="field">
          <label>Nombre *</label>
          <input name="nombre" [(ngModel)]="nombre" required placeholder="Ej: Villa Los Aromos" />
        </div>
        <div class="field">
          <label>Comuna</label>
          <input name="comuna" [(ngModel)]="comuna" placeholder="Ej: Maipú" />
        </div>
        <div class="field">
          <label>Correo del administrador *</label>
          <input name="adminEmail" type="email" [(ngModel)]="adminEmail" required placeholder="dirigente@ejemplo.cl" />
        </div>
        @if (error()) { <p class="msg-error">{{ error() }}</p> }
        <button type="submit" class="btn-primary" [disabled]="creando() || !f.valid">
          {{ creando() ? 'Creando…' : 'Crear comunidad' }}
        </button>
      </form>

      @if (creada(); as c) {
        <div class="pp-creada">
          <strong>✔ {{ c.nombre }} creada</strong>
          <div class="pp-creada-row">Portal: <code>{{ c.url }}</code></div>
          <div class="pp-creada-row">Código de acceso del admin: <code>{{ c.codigo }}</code></div>
          <p class="pp-hint">El administrador inicia sesión con su correo y el código como contraseña temporal.</p>
        </div>
      }
    </div>

    <div class="pp-card pp-list">
      <div class="pp-list-head">
        <h2>Comunidades</h2>
        <span class="count-badge">{{ comunidades().length }}</span>
      </div>
      @if (cargando()) {
        <p class="msg-muted">Cargando…</p>
      } @else if (comunidades().length === 0) {
        <p class="msg-muted">Aún no hay comunidades. Crea la primera.</p>
      } @else {
        <div class="pp-items">
          @for (c of comunidades(); track c.id) {
            <div class="pp-item" [class.suspendida]="c.estado === 'SUSPENDIDA'">
              <div class="pp-item-main">
                <div class="pp-item-nombre">
                  {{ c.nombre }}
                  @if (c.estado === 'ACTIVA') { <span class="badge-activa">Activa</span> }
                  @else { <span class="badge-susp">Suspendida</span> }
                </div>
                <div class="pp-item-meta">{{ c.comuna || '—' }} · <code>{{ c.url }}</code> · código <code>{{ c.codigo }}</code></div>
                <div class="pp-item-admin">👤 {{ c.adminEmail }}</div>
              </div>
              <div class="pp-item-acc">
                @if (c.estado === 'ACTIVA') {
                  <button class="b-susp" (click)="cambiar(c, 'SUSPENDIDA')">Suspender</button>
                } @else {
                  <button class="b-act" (click)="cambiar(c, 'ACTIVA')">Reactivar</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

  </div>
</div>
  `,
  styles: [`
    .pp-header { background: #1f2937; color: #fff; }
    .pp-header-inner { max-width: 1100px; margin: 0 auto; padding: 0.9rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .pp-title { font-weight: 800; }
    .pp-logout { background: rgba(255,255,255,0.15); border: none; color: #fff; border-radius: 6px; padding: 6px 14px; cursor: pointer; }
    .pp-logout:hover { background: rgba(255,255,255,0.28); }
    .pp-body { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
    .pp-grid { display: grid; grid-template-columns: 360px 1fr; gap: 1.25rem; align-items: start; }
    .pp-card { background: #fff; border: 1px solid #eef2f7; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .pp-card h2 { margin: 0 0 0.5rem; font-size: 1.05rem; color: #1f2937; }
    .pp-hint { font-size: 0.8rem; color: #6b7280; margin: 0 0 0.75rem; }
    .field { margin-bottom: 0.8rem; }
    .field label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .field input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.88rem; }
    .btn-primary { width: 100%; background: #1f2937; color: #fff; border: none; border-radius: 7px; padding: 10px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { background: #111827; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg-error { color: #dc2626; font-size: 0.82rem; margin: 0 0 0.5rem; }
    .msg-muted { color: #9ca3af; font-size: 0.86rem; }
    .pp-creada { margin-top: 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem; font-size: 0.84rem; color: #166534; }
    .pp-creada-row { margin-top: 4px; }
    .pp-creada code, .pp-item-meta code { background: #eef2f7; color: #1f2937; padding: 1px 6px; border-radius: 4px; }
    .pp-list-head { display: flex; align-items: center; gap: 10px; margin-bottom: 0.75rem; }
    .count-badge { background: #1f2937; color: #fff; border-radius: 999px; font-size: 0.72rem; padding: 2px 9px; font-weight: 700; }
    .pp-items { display: flex; flex-direction: column; gap: 8px; }
    .pp-item { display: flex; justify-content: space-between; gap: 12px; border: 1px solid #eef2f7; border-radius: 8px; padding: 0.85rem; }
    .pp-item.suspendida { opacity: 0.6; }
    .pp-item-nombre { font-weight: 700; color: #1f2937; }
    .pp-item-meta { font-size: 0.76rem; color: #6b7280; margin: 3px 0; }
    .pp-item-admin { font-size: 0.78rem; color: #4b5563; }
    .badge-activa { background: #ecfdf5; color: #047857; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .badge-susp { background: #fef2f2; color: #b91c1c; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .b-susp { background: #fff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; padding: 5px 12px; font-size: 0.78rem; cursor: pointer; white-space: nowrap; }
    .b-act { background: #059669; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.78rem; cursor: pointer; white-space: nowrap; }
    @media (max-width: 760px) { .pp-grid { grid-template-columns: 1fr; } }
  `],
})
export class PlatformPanel implements OnInit {
  protected readonly platform = inject(PlatformService);

  comunidades = signal<ComunidadPlatform[]>([]);
  cargando = signal(true);
  creando = signal(false);
  error = signal<string | null>(null);
  creada = signal<ComunidadPlatform | null>(null);

  nombre = '';
  comuna = '';
  adminEmail = '';

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    this.cargando.set(true);
    this.platform.listar().subscribe({
      next: (d) => { this.comunidades.set(d); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  crear(): void {
    this.creando.set(true);
    this.error.set(null);
    this.platform.crear({ nombre: this.nombre.trim(), comuna: this.comuna.trim() || null, adminEmail: this.adminEmail.trim() })
      .subscribe({
        next: (c) => {
          this.comunidades.update((prev) => [c, ...prev]);
          this.creada.set(c);
          this.nombre = ''; this.comuna = ''; this.adminEmail = '';
          this.creando.set(false);
        },
        error: () => { this.creando.set(false); this.error.set('No se pudo crear la comunidad. Revisa los datos e intenta de nuevo.'); },
      });
  }

  cambiar(c: ComunidadPlatform, estado: string): void {
    this.platform.cambiarEstado(c.id, estado).subscribe({
      next: (u) => this.comunidades.update((prev) => prev.map((x) => x.id === u.id ? u : x)),
    });
  }
}
