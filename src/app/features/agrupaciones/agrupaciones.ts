import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { EventoService } from '../../community/evento.service';
import { Agrupacion, AgrupacionRequest } from '../../community/agrupacion.models';
import { Evento, EventoRequest } from '../../community/evento.models';
import { RouterLink } from '@angular/router';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Sección Agrupaciones — organizaciones comunitarias + actividades + socios + reuniones. */
@Component({
  selector: 'app-agrupaciones',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#0f766e 0%,#0d9488 60%,#14b8a6 100%)">
  <div class="hero-inner">
    <h1>Agrupaciones</h1>
    <p>Organizaciones de la comunidad: clubes, talleres, comités y más. Inscríbete y participa de sus actividades.</p>
    @if (isAdmin()) {
      <button class="btn-hero" (click)="nuevaAgrupacion()">{{ showForm() ? '✕ Cancelar' : '+ Nueva agrupación' }}</button>
    }
  </div>
</section>

<div class="content-area">
  @if (isAdmin() && showForm()) {
    <div class="form-panel">
      <h3>{{ editingId() ? 'Editar agrupación' : 'Nueva agrupación' }}</h3>
      <form (ngSubmit)="guardar()" #f="ngForm">
        <div class="field">
          <label>Nombre *</label>
          <input name="nombre" [(ngModel)]="form.nombre" required />
        </div>
        <div class="field">
          <label>Descripción</label>
          <textarea name="descripcion" [(ngModel)]="form.descripcion" rows="2"></textarea>
        </div>
        <div class="field">
          <label>Responsable <span class="opt">(opcional)</span></label>
          <input name="responsable" [(ngModel)]="form.responsable" />
        </div>

        <div class="form-sub">Reunión periódica <span class="opt">(opcional)</span></div>
        <div class="form-row">
          <div class="field">
            <label>Día de reunión</label>
            <select name="dia" [(ngModel)]="form.reunionDiaSemana">
              <option [ngValue]="null">Sin reunión fija</option>
              @for (d of [1,2,3,4,5,6,7]; track d) { <option [ngValue]="d">{{ diaLabel(d) }}</option> }
            </select>
          </div>
          <div class="field field-sm">
            <label>Hora</label>
            <input name="hora" type="time" [(ngModel)]="form.reunionHora" />
          </div>
        </div>

        <div class="form-sub">Pausa / vacaciones <span class="opt">(opcional — no habrá reuniones en ese rango)</span></div>
        <div class="form-row">
          <div class="field">
            <label>Desde</label>
            <input name="pi" type="date" [(ngModel)]="form.pausaInicio" />
          </div>
          <div class="field">
            <label>Hasta</label>
            <input name="pf" type="date" [(ngModel)]="form.pausaFin" />
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="cancelarForm()">Cancelar</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !f.valid">{{ editingId() ? 'Guardar' : 'Crear' }}</button>
        </div>
      </form>
    </div>
  }

  @if (loading()) {
    <p class="msg-muted">Cargando agrupaciones…</p>
  } @else if (agrupaciones().length === 0) {
    <p class="msg-muted">Aún no hay agrupaciones.</p>
  } @else {
    <div class="agr-grid">
      @for (a of agrupaciones(); track a.id) {
        <article class="agr-card">
          <div class="agr-head">
            <span class="agr-nombre">{{ a.nombre }}</span>
            <span class="agr-socios">{{ a.socios }} socio{{ a.socios === 1 ? '' : 's' }}</span>
          </div>
          <div class="agr-body">
            @if (a.descripcion) { <p class="agr-desc">{{ a.descripcion }}</p> }
            @if (a.responsable) { <p class="agr-resp">Responsable: {{ a.responsable }}</p> }

            @if (a.reunionDiaSemana) {
              <p class="agr-reunion">🕒 Se reúne los {{ diaLabel(a.reunionDiaSemana) }}@if (a.reunionHora) { a las {{ a.reunionHora.slice(0,5) }} }</p>
            }
            @if (enPausa(a)) {
              <p class="agr-pausa">⏸ Reuniones en pausa{{ a.pausaFin ? ' hasta el ' + (a.pausaFin | date:'dd/MM/yyyy') : '' }}</p>
            }

            <div class="agr-actividades">
              <strong>Próximas actividades</strong>
              @if (actividadesDe(a.id).length === 0) {
                <p class="msg-muted" style="font-size:.8rem">Sin actividades programadas.</p>
              } @else {
                @for (ev of actividadesDe(a.id); track ev.id) {
                  <div class="act-item">
                    <span class="act-fecha">📅 {{ ev.fechaInicio | date:'dd/MM HH:mm' }}</span>
                    <span class="act-titulo">{{ ev.titulo }}</span>
                    @if (ev.ubicacion) { <span class="act-lugar">📍 {{ ev.ubicacion }}</span> }
                  </div>
                }
              }
            </div>

            @if (sociosVisible() === a.id) {
              <div class="socios-box">
                <strong>Socios ({{ sociosList().length }})</strong>
                @if (sociosList().length === 0) {
                  <p class="msg-muted" style="font-size:.8rem">Aún no hay socios inscritos.</p>
                } @else {
                  @for (s of sociosList(); track s) {
                    <div class="socio-item">
                      <span class="socio-nombre">{{ nombreDe(s) }}</span>
                      @if (vecinoNombre()[s]) { <span class="socio-mail">{{ s }}</span> }
                    </div>
                  }
                }
              </div>
            }

            @if (isAdmin() && actividadForm() === a.id) {
              <form class="act-form" (ngSubmit)="crearActividad(a)" #af="ngForm">
                <input name="at" [(ngModel)]="actTitulo" required placeholder="Título de la actividad" />
                <input name="afe" type="datetime-local" [(ngModel)]="actFecha" required />
                <input name="al" [(ngModel)]="actLugar" placeholder="Lugar (opcional)" />
                <div class="form-actions">
                  <button type="button" class="btn-ghost" (click)="actividadForm.set(null)">Cancelar</button>
                  <button type="submit" class="btn-primary" [disabled]="!af.valid">Agregar</button>
                </div>
              </form>
            }
          </div>

          <div class="agr-cta">
            @if (a.inscrito) {
              <button class="btn-inscrito" (click)="salir(a)">✔ Inscrito · Salir</button>
              @if (!isAdmin()) {
                <div class="mis-toggles">
                  <button [routerLink]="['/portal/agrupaciones', a.id, 'cuotas']">Mis cuotas</button>
                  <button [routerLink]="['/portal/agrupaciones', a.id, 'asistencia']">Mi asistencia</button>
                </div>
              }
            } @else {
              <button class="btn-inscribir" [disabled]="enRevision()" [title]="enRevision() ? 'Tu cuenta está en revisión' : ''" (click)="inscribirse(a)">Inscribirme</button>
            }
          </div>

          @if (isAdmin()) {
            <div class="agr-admin">
              <button class="gestion-toggle" [class.abierto]="menuAbierto() === a.id" (click)="toggleMenu(a.id)">
                <span>⚙ Gestión</span>
                <span class="chevron">{{ menuAbierto() === a.id ? '▲' : '▾' }}</span>
              </button>
              @if (menuAbierto() === a.id) {
                <div class="gestion-menu">
                  <button (click)="editar(a); menuAbierto.set(null)"><span class="gi">✏️</span> Editar</button>
                  <button (click)="verSocios(a)"><span class="gi">👥</span> {{ sociosVisible() === a.id ? 'Ocultar socios' : 'Ver socios' }}</button>
                  <button (click)="toggleActividad(a.id)"><span class="gi">📅</span> Actividad</button>
                  <button [routerLink]="['/portal/agrupaciones', a.id, 'cuotas']"><span class="gi">💰</span> Cuotas</button>
                  <button [routerLink]="['/portal/agrupaciones', a.id, 'asistencia']"><span class="gi">📋</span> Asistencia</button>
                  <button class="danger" (click)="eliminar(a); menuAbierto.set(null)"><span class="gi">🗑</span> Eliminar</button>
                </div>
              }
            </div>
          }
        </article>
      }
    </div>
  }
</div>
  `,
  styles: [`
    .form-sub { font-size: 0.78rem; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.04em; margin: 0.75rem 0 0.5rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem; }
    .agr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
    .agr-card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.07); display: flex; flex-direction: column; transition: box-shadow 0.15s, transform 0.15s; }
    .agr-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .agr-head { padding: 0.75rem 1rem; min-height: 60px; display: flex; align-items: center; justify-content: space-between; color: #fff; background: #0d9488; gap: 8px; }
    .agr-nombre { font-size: 0.97rem; font-weight: 800; }
    .agr-socios { font-size: 0.72rem; background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
    .agr-body { padding: 1rem; flex: 1; }
    .agr-desc { color: #6b7280; font-size: 0.86rem; margin: 0 0 0.5rem; }
    .agr-resp { color: #9ca3af; font-size: 0.78rem; margin: 0 0 0.4rem; }
    .agr-reunion { color: #0f766e; font-size: 0.82rem; font-weight: 600; margin: 0 0 0.25rem; }
    .agr-pausa { color: #b45309; font-size: 0.8rem; font-weight: 600; margin: 0 0 0.5rem; }
    .agr-actividades { border-top: 1px solid #f3f4f6; padding-top: 0.75rem; margin-top: 0.5rem; }
    .agr-actividades strong { font-size: 0.8rem; color: #374151; display: block; margin-bottom: 0.4rem; }
    .act-item { display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8rem; padding: 4px 0; border-bottom: 1px solid #f9fafb; }
    .act-fecha { color: #0d9488; font-weight: 600; }
    .act-titulo { color: #1f2937; }
    .act-lugar { color: #9ca3af; }
    .act-form { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 6px; background: #f9fafb; padding: 0.75rem; border-radius: 6px; }
    .socios-box { border-top: 1px solid #f3f4f6; padding-top: 0.75rem; margin-top: 0.5rem; }
    .socios-box strong { font-size: 0.8rem; color: #374151; display: block; margin-bottom: 0.4rem; }
    .socio-item { font-size: 0.8rem; color: #1f2937; padding: 3px 0; display: flex; flex-direction: column; }
    .socio-nombre { font-weight: 600; }
    .socio-mail { font-size: 0.72rem; color: #9ca3af; }
    /* CTA principal (vecino) */
    .agr-cta { padding: 0.85rem 1rem; border-top: 1px solid #f3f4f6; }
    .btn-inscribir { width: 100%; background: #003087; color: #fff; border: none; border-radius: 6px; padding: 10px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-inscribir:hover { background: #00256b; }
    .btn-inscribir:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-inscrito { width: 100%; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px; font-size: 0.88rem; font-weight: 700; cursor: pointer; }
    .btn-inscrito:hover { background: #d1fae5; }
    .mis-toggles { display: flex; gap: 8px; margin-top: 8px; }
    .mis-toggles button { flex: 1; background: #f0fdfa; color: #0f766e; border: 1px solid #ccfbf1; border-radius: 6px; padding: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
    .mis-toggles button:hover { background: #ccfbf1; }
    /* Barra de gestión (admin) */
    .agr-admin { background: #f8fafc; border-top: 1px solid #eef2f7; padding: 0.5rem 0.75rem; }
    .gestion-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; background: #fff; border: 1px solid #e2e8f0; color: #475569; font-size: 0.82rem; font-weight: 600; padding: 7px 12px; border-radius: 7px; cursor: pointer; }
    .gestion-toggle:hover, .gestion-toggle.abierto { background: #eef2f7; color: #1f2937; }
    .gestion-toggle .chevron { color: #94a3b8; font-size: 0.7rem; }
    .gestion-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
    .gestion-menu button { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; color: #374151; font-size: 0.8rem; padding: 8px 10px; border-radius: 7px; cursor: pointer; text-align: left; }
    .gestion-menu button:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .gestion-menu .gi { font-size: 0.95rem; }
    .gestion-menu button.danger { color: #dc2626; border-color: #fecaca; }
    .gestion-menu button.danger:hover { background: #fef2f2; }
  `],
})
export class Agrupaciones implements OnInit {
  private readonly svc = inject(AgrupacionService);
  private readonly eventoSvc = inject(EventoService);
  private readonly auth = inject(AuthService);

  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  agrupaciones = signal<Agrupacion[]>([]);
  eventos = signal<Evento[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  actividadForm = signal<string | null>(null);
  sociosVisible = signal<string | null>(null);
  sociosList = signal<string[]>([]);
  vecinoNombre = signal<Record<string, string>>({});
  menuAbierto = signal<string | null>(null);

  form: AgrupacionRequest = this.emptyForm();
  actTitulo = '';
  actFecha = '';
  actLugar = '';

  ngOnInit(): void {
    this.cargar();
    this.eventoSvc.getAll().subscribe({ next: (e) => this.eventos.set(e) });
    if (this.isAdmin()) {
      this.auth.getVecinos().subscribe({
        next: (vs) => {
          const m: Record<string, string> = {};
          vs.forEach((v) => { if (v.email) m[v.email] = v.name; });
          this.vecinoNombre.set(m);
        },
      });
    }
  }

  nombreDe(email: string): string {
    return this.vecinoNombre()[email] ?? email;
  }

  enRevision(): boolean { return this.auth.enRevision(); }

  toggleMenu(id: string): void {
    this.menuAbierto.set(this.menuAbierto() === id ? null : id);
  }

  private emptyForm(): AgrupacionRequest {
    return { nombre: '', descripcion: null, responsable: null, reunionDiaSemana: null, reunionHora: null, pausaInicio: null, pausaFin: null };
  }

  private cargar(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (d) => { this.agrupaciones.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  diaLabel(n: number | null): string {
    return n && n >= 1 && n <= 7 ? DIAS[n] : '';
  }

  enPausa(a: Agrupacion): boolean {
    if (!a.pausaInicio) return false;
    const hoy = new Date();
    const ini = new Date(a.pausaInicio + 'T00:00:00');
    const fin = a.pausaFin ? new Date(a.pausaFin + 'T23:59:59') : null;
    return hoy >= ini && (fin === null || hoy <= fin);
  }

  actividadesDe(agrupacionId: string): Evento[] {
    const ahora = Date.now();
    return this.eventos()
      .filter((e) => e.agrupacionId === agrupacionId && new Date(e.fechaInicio).getTime() >= ahora)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  }

  nuevaAgrupacion(): void {
    if (this.showForm() && !this.editingId()) { this.showForm.set(false); return; }
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  editar(a: Agrupacion): void {
    this.editingId.set(a.id);
    this.form = {
      nombre: a.nombre, descripcion: a.descripcion, responsable: a.responsable,
      reunionDiaSemana: a.reunionDiaSemana, reunionHora: a.reunionHora ? a.reunionHora.slice(0, 5) : null,
      pausaInicio: a.pausaInicio, pausaFin: a.pausaFin,
    };
    this.showForm.set(true);
  }

  cancelarForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  guardar(): void {
    this.saving.set(true);
    const id = this.editingId();
    const done = (a: Agrupacion) => {
      this.agrupaciones.update((prev) => {
        const rest = prev.filter((x) => x.id !== a.id);
        return [...rest, a].sort((x, y) => x.nombre.localeCompare(y.nombre));
      });
      this.form = this.emptyForm();
      this.showForm.set(false); this.editingId.set(null); this.saving.set(false);
    };
    const obs = id ? this.svc.update(id, this.form) : this.svc.create(this.form);
    obs.subscribe({ next: done, error: () => this.saving.set(false) });
  }

  eliminar(a: Agrupacion): void {
    this.svc.delete(a.id).subscribe({ next: () => this.agrupaciones.update((p) => p.filter((x) => x.id !== a.id)) });
  }

  inscribirse(a: Agrupacion): void {
    this.svc.inscribirse(a.id).subscribe({ next: () => this.patch(a.id, { inscrito: true, socios: a.socios + 1 }) });
  }

  salir(a: Agrupacion): void {
    this.svc.salir(a.id).subscribe({ next: () => this.patch(a.id, { inscrito: false, socios: Math.max(0, a.socios - 1) }) });
  }

  private patch(id: string, changes: Partial<Agrupacion>): void {
    this.agrupaciones.update((prev) => prev.map((x) => x.id === id ? { ...x, ...changes } : x));
  }

  verSocios(a: Agrupacion): void {
    if (this.sociosVisible() === a.id) { this.sociosVisible.set(null); return; }
    this.sociosVisible.set(a.id);
    this.sociosList.set([]);
    this.svc.socios(a.id).subscribe({ next: (list) => this.sociosList.set(list) });
  }

  toggleActividad(id: string): void {
    this.actividadForm.set(this.actividadForm() === id ? null : id);
    this.actTitulo = ''; this.actFecha = ''; this.actLugar = '';
  }

  crearActividad(a: Agrupacion): void {
    const req: EventoRequest = {
      titulo: this.actTitulo,
      descripcion: '',
      fechaInicio: this.actFecha,
      fechaFin: null,
      ubicacion: this.actLugar || null,
      categoria: 'TALLER',
      agrupacionId: a.id,
    };
    this.eventoSvc.create(req).subscribe({
      next: (ev) => { this.eventos.update((prev) => [...prev, ev]); this.actividadForm.set(null); },
    });
  }
}
