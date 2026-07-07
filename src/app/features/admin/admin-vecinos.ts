import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Vecino } from '../../auth/models/auth.models';

interface EditForm { name: string; email: string; telefono: string; direccion: string; }

/** Página: gestión de vecinos en tabla (validar residencia, editar, eliminar). */
@Component({
  selector: 'app-admin-vecinos',
  standalone: true,
  imports: [FormsModule],
  template: `
<section class="hero hero-admin">
  <div class="hero-inner">
    <button class="btn-volver" (click)="volver()">‹ Volver a Administración</button>
    <h1>Gestión de vecinos</h1>
    <p>{{ vecinos().length }} vecino(s) · {{ enRevision() }} en revisión.</p>
  </div>
</section>

<div class="content-area">
  @if (loading()) {
    <p class="msg-muted">Cargando vecinos…</p>
  } @else if (vecinos().length === 0) {
    <div class="empty-state"><span>👥</span><p>No hay vecinos registrados.</p></div>
  } @else {
    <div class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th><th>Email</th><th>RUT</th><th>Teléfono</th><th>Dirección</th><th>Rol</th><th>Estado</th><th class="th-acc">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (v of vecinos(); track v.id) {
            @if (editando() === v.id) {
              <tr class="fila-edit">
                <td><input [(ngModel)]="ef.name" placeholder="Nombre" /></td>
                <td><input [(ngModel)]="ef.email" placeholder="Email" /></td>
                <td class="dim">{{ v.rut || '—' }}</td>
                <td><input [(ngModel)]="ef.telefono" placeholder="Teléfono" /></td>
                <td><input [(ngModel)]="ef.direccion" placeholder="Dirección" /></td>
                <td class="dim">{{ rolLabel(v.role) }}</td>
                <td>{{ estadoLabel(v) }}</td>
                <td class="acc">
                  <button class="b-ok" [disabled]="guardando()" (click)="guardar(v)">Guardar</button>
                  <button class="b-ghost" (click)="editando.set(null)">Cancelar</button>
                </td>
              </tr>
            } @else {
              <tr>
                <td class="fw">{{ v.name }}</td>
                <td>{{ v.email }}</td>
                <td>{{ v.rut || '—' }}</td>
                <td>{{ v.telefono || '—' }}</td>
                <td>{{ v.direccion || '—' }}</td>
                <td><span [class.rol-dest]="v.role !== 'VECINO'">{{ rolLabel(v.role) }}</span></td>
                <td>
                  @if (v.accesoAprobado) { <span class="badge-ok">Con acceso</span> }
                  @else { <span class="badge-rev">En revisión</span> }
                </td>
                <td class="acc">
                  @if (v.accesoAprobado) {
                    <button class="b-acceso b-ghost" (click)="setAcceso(v, false)">Suspender</button>
                  } @else {
                    <button class="b-acceso b-ok" (click)="setAcceso(v, true)">Aprobar</button>
                  }
                  <button class="b-ico b-edit" title="Editar" (click)="editar(v)">✎</button>
                  @if (confirmandoDelete() === v.id) {
                    <span class="del-confirm">¿Eliminar?
                      <button class="b-del" (click)="confirmarEliminar(v)">Sí</button>
                      <button class="b-ico b-ghost" (click)="confirmandoDelete.set(null)">✕</button>
                    </span>
                  } @else {
                    <button class="b-ico b-del-ico" title="Eliminar" (click)="confirmandoDelete.set(v.id)">🗑</button>
                  }
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  }
</div>
  `,
  styles: [`
    .btn-volver { background: rgba(255,255,255,0.2); border: none; color: #fff; border-radius: 6px; padding: 5px 12px; font-size: 0.82rem; cursor: pointer; margin-bottom: 0.75rem; }
    .btn-volver:hover { background: rgba(255,255,255,0.32); }
    .tabla-wrap { overflow-x: auto; background: #fff; border: 1px solid #eef2f7; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .tabla { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
    .tabla th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; padding: 10px 12px; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
    .tabla td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
    .tabla .fw { font-weight: 600; color: #1f2937; }
    .tabla .dim { color: #9ca3af; }
    .tabla input { width: 100%; min-width: 90px; padding: 5px 7px; border: 1px solid #d1d5db; border-radius: 5px; font-size: 0.82rem; }
    .fila-edit td { background: #f8fafc; }
    .th-acc { text-align: right; }
    .acc { display: flex; gap: 6px; align-items: center; justify-content: flex-end; white-space: nowrap; }
    .rol-dest { font-weight: 700; color: #3730a3; }
    .b-acceso { min-width: 92px; text-align: center; padding: 6px 10px; font-size: 0.76rem; border-radius: 6px; }
    .b-ico { width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 0.85rem; flex-shrink: 0; }
    .badge-ok { background: #ecfdf5; color: #047857; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; }
    .badge-pend { background: #fef9c3; color: #854d0e; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; }
    .badge-rev { background: #fef9c3; color: #854d0e; font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 999px; }
    .badge-res { font-size: 0.8rem; margin-left: 2px; }
    .badge-rol { background: #eef2ff; color: #3730a3; font-weight: 700; font-size: 0.68rem; padding: 2px 7px; border-radius: 999px; margin-left: 4px; }
    .b-ok { background: #059669; color: #fff; border: none; border-radius: 5px; padding: 4px 10px; font-size: 0.76rem; cursor: pointer; }
    .b-ghost { background: #fff; border: 1px solid #d1d5db; border-radius: 5px; padding: 4px 10px; font-size: 0.76rem; cursor: pointer; }
    .b-edit { background: #eef2ff; color: #3730a3; border: none; cursor: pointer; }
    .b-del-ico { background: #fef2f2; color: #dc2626; border: none; cursor: pointer; }
    .b-del { background: #dc2626; color: #fff; border: none; border-radius: 5px; padding: 4px 10px; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
    .del-confirm { display: inline-flex; align-items: center; gap: 5px; font-size: 0.76rem; color: #374151; }
  `],
})
export class AdminVecinos implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  vecinos = signal<Vecino[]>([]);
  loading = signal(true);
  editando = signal<string | null>(null);
  confirmandoDelete = signal<string | null>(null);
  guardando = signal(false);
  ef: EditForm = { name: '', email: '', telefono: '', direccion: '' };

  enRevision = () => this.vecinos().filter((v) => !v.accesoAprobado).length;

  ngOnInit(): void {
    this.auth.getVecinos().subscribe({
      next: (d) => { this.vecinos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  estadoLabel(v: Vecino): string { return v.estadoValidacion === 'VALIDADO' ? 'Validado' : 'Pendiente'; }
  rolLabel(role: string): string { return role === 'COMMUNITY_ADMIN' ? 'Dirigente' : role === 'PLATFORM_ADMIN' ? 'Admin' : 'Vecino'; }

  validar(v: Vecino): void { this.auth.validarVecino(v.id).subscribe({ next: (u) => this.patch(u) }); }
  revocar(v: Vecino): void { this.auth.revocarVecino(v.id).subscribe({ next: (u) => this.patch(u) }); }
  setAcceso(v: Vecino, aprobado: boolean): void { this.auth.setAccesoVecino(v.id, aprobado).subscribe({ next: (u) => this.patch(u) }); }

  editar(v: Vecino): void {
    this.editando.set(v.id);
    this.confirmandoDelete.set(null);
    this.ef = { name: v.name ?? '', email: v.email ?? '', telefono: v.telefono ?? '', direccion: v.direccion ?? '' };
  }

  guardar(v: Vecino): void {
    this.guardando.set(true);
    this.auth.updateVecino(v.id, {
      name: this.ef.name,
      email: this.ef.email,
      telefono: this.ef.telefono || null,
      direccion: this.ef.direccion || null,
    }).subscribe({
      next: (u) => { this.patch(u); this.editando.set(null); this.guardando.set(false); },
      error: () => this.guardando.set(false),
    });
  }

  confirmarEliminar(v: Vecino): void {
    this.auth.deleteVecino(v.id).subscribe({
      next: () => { this.vecinos.update((p) => p.filter((x) => x.id !== v.id)); this.confirmandoDelete.set(null); },
    });
  }

  private patch(u: Vecino): void {
    this.vecinos.update((prev) => prev.map((x) => x.id === u.id ? u : x));
  }

  volver(): void { this.router.navigate(['/portal/admin']); }
}
