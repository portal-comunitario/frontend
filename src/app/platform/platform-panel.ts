import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ComunidadPlatform, PlatformService } from './platform.service';

@Component({
  selector: 'app-platform-panel',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
          <label>Dirección de la sede *</label>
          <input name="sedeDireccion" [(ngModel)]="sedeDireccion" required placeholder="Ej: Av. Pajaritos 2900, Maipú" />
          <span class="pp-hint">Centra el mapa y es el punto de retiro de certificados.</span>
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
                <dl class="pp-meta">
                  <div><dt>Comuna</dt><dd>{{ c.comuna || '—' }}</dd></div>
                  <div><dt>Portal</dt><dd><code>{{ c.url }}</code></dd></div>
                  <div><dt>Código</dt><dd><code>{{ c.codigo }}</code></dd></div>
                  <div><dt>Admin</dt><dd>{{ c.adminEmail }}</dd></div>
                </dl>
              </div>
              <div class="pp-item-acc">
                <a class="b-abrir" [routerLink]="['/c', c.slug]" target="_blank">Abrir portal ↗</a>
                <button class="b-edit" (click)="abrirEditar(c)">Editar</button>
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

@if (editando(); as e) {
  <div class="pp-modal-back" (click)="cerrarEditar()">
    <div class="pp-modal" (click)="$event.stopPropagation()">
      <h2>Editar comunidad</h2>
      <p class="pp-hint">La URL del portal (<code>/c/{{ e.slug }}</code>) no cambia.</p>
      <form (ngSubmit)="guardarEdicion()" #ef="ngForm">
        <div class="field">
          <label>Nombre *</label>
          <input name="enombre" [(ngModel)]="edNombre" required />
        </div>
        <div class="field">
          <label>Comuna</label>
          <input name="ecomuna" [(ngModel)]="edComuna" />
        </div>
        <div class="field">
          <label>Dirección de la sede *</label>
          <input name="esede" [(ngModel)]="edSedeDireccion" required />
        </div>
        <div class="field">
          <label>Correo del administrador *</label>
          <input name="eadmin" type="email" [(ngModel)]="edAdminEmail" required />
          <span class="pp-hint">Si lo cambias, el nuevo admin entra con su correo y el código <code>{{ e.codigo }}</code>.</span>
        </div>
        @if (edError()) { <p class="msg-error">{{ edError() }}</p> }
        <div class="pp-modal-acc">
          <button type="button" class="b-cancel" (click)="cerrarEditar()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="guardando() || !ef.valid">
            {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}
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
    .pp-items { display: flex; flex-direction: column; gap: 10px; }
    .pp-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border: 1px solid #eef2f7; border-radius: 8px; padding: 0.9rem 1rem; }
    .pp-item.suspendida { opacity: 0.6; }
    .pp-item-main { min-width: 0; flex: 1; }
    .pp-item-nombre { font-weight: 700; color: #1f2937; margin-bottom: 6px; }
    .pp-meta { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 0.78rem; }
    .pp-meta > div { display: contents; }
    .pp-meta dt { color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.68rem; align-self: center; }
    .pp-meta dd { margin: 0; color: #4b5563; overflow-wrap: anywhere; }
    .badge-activa { background: #ecfdf5; color: #047857; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .badge-susp { background: #fef2f2; color: #b91c1c; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-left: 6px; }
    .pp-item-acc { display: flex; flex-direction: column; align-items: stretch; gap: 6px; width: 132px; flex-shrink: 0; }
    .pp-item-acc > * { text-align: center; border-radius: 6px; padding: 6px 12px; font-size: 0.78rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .b-abrir { background: #eef2ff; color: #3730a3; text-decoration: none; border: 1px solid transparent; }
    .b-abrir:hover { background: #e0e7ff; }
    .b-edit { background: #fff; color: #374151; border: 1px solid #d1d5db; }
    .b-edit:hover { background: #f3f4f6; }
    .b-susp { background: #fff; color: #dc2626; border: 1px solid #fca5a5; }
    .b-susp:hover { background: #fef2f2; }
    .b-act { background: #059669; color: #fff; border: 1px solid transparent; }
    .b-act:hover { background: #047857; }
    .pp-modal-back { position: fixed; inset: 0; background: rgba(17,24,39,0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50; }
    .pp-modal { background: #fff; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); }
    .pp-modal h2 { margin: 0 0 0.25rem; font-size: 1.1rem; color: #1f2937; }
    .pp-modal-acc { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.5rem; }
    .b-cancel { background: #fff; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; padding: 10px 16px; font-weight: 600; cursor: pointer; }
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
  sedeDireccion = '';

  editando = signal<ComunidadPlatform | null>(null);
  guardando = signal(false);
  edError = signal<string | null>(null);
  edNombre = '';
  edComuna = '';
  edAdminEmail = '';
  edSedeDireccion = '';

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
    this.platform.crear({ nombre: this.nombre.trim(), comuna: this.comuna.trim() || null, adminEmail: this.adminEmail.trim(), sedeDireccion: this.sedeDireccion.trim() })
      .subscribe({
        next: (c) => {
          this.comunidades.update((prev) => [c, ...prev]);
          this.creada.set(c);
          this.nombre = ''; this.comuna = ''; this.adminEmail = ''; this.sedeDireccion = '';
          this.creando.set(false);
        },
        error: () => { this.creando.set(false); this.error.set('No se pudo crear la comunidad. Revisa los datos e intenta de nuevo.'); },
      });
  }

  abrirEditar(c: ComunidadPlatform): void {
    this.edError.set(null);
    this.edNombre = c.nombre;
    this.edComuna = c.comuna ?? '';
    this.edAdminEmail = c.adminEmail;
    this.edSedeDireccion = c.sedeDireccion ?? '';
    this.editando.set(c);
  }

  cerrarEditar(): void {
    this.editando.set(null);
    this.guardando.set(false);
  }

  guardarEdicion(): void {
    const c = this.editando();
    if (!c) return;
    this.guardando.set(true);
    this.edError.set(null);
    this.platform.actualizar(c.id, {
      nombre: this.edNombre.trim(),
      comuna: this.edComuna.trim() || null,
      adminEmail: this.edAdminEmail.trim(),
      sedeDireccion: this.edSedeDireccion.trim(),
    }).subscribe({
      next: (u) => {
        this.comunidades.update((prev) => prev.map((x) => x.id === u.id ? u : x));
        this.cerrarEditar();
      },
      error: () => { this.guardando.set(false); this.edError.set('No se pudieron guardar los cambios.'); },
    });
  }

  cambiar(c: ComunidadPlatform, estado: string): void {
    this.platform.cambiarEstado(c.id, estado).subscribe({
      next: (u) => this.comunidades.update((prev) => prev.map((x) => x.id === u.id ? u : x)),
    });
  }
}
