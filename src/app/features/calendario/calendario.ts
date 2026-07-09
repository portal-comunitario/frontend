import { Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { EventoService } from '../../community/evento.service';
import { AgrupacionService } from '../../community/agrupacion.service';
import { Evento } from '../../community/evento.models';
import { Agrupacion } from '../../community/agrupacion.models';
import { expandirEventos } from '../../core/recurrence.util';

interface CalItem {
  kind: 'evento' | 'reunion';
  key: string;
  hora: string;
  titulo: string;
  agrupacionId?: string;
  cancelada?: boolean;
  ubicacion?: string | null;
}

interface Celda {
  fecha: Date;
  dia: number;
  delMes: boolean;
  hoy: boolean;
  items: CalItem[];
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [],
  template: `
<section class="hero" style="background: linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#2563eb 100%)">
  <div class="hero-inner">
    <h1>Calendario</h1>
    <p>Eventos de la comunidad y reuniones de las agrupaciones en un solo lugar.</p>
  </div>
</section>

<div class="content-area">
  <div class="cal-toolbar">
    <button class="btn-secondary" (click)="mes(-1)">‹ Mes anterior</button>
    <strong class="cal-mes">{{ nombreMes() }}</strong>
    <button class="btn-secondary" (click)="mes(1)">Mes siguiente ›</button>
    <button class="btn-ghost" (click)="irHoy()">Hoy</button>
    <span class="cal-leyenda">
      <span class="dot dot-general"></span> Evento
      <span class="dot dot-reunion"></span> Reunión
    </span>
  </div>

  @if (isAdmin()) {
    <p class="msg-muted" style="font-size:.8rem; margin:-0.25rem 0 0.75rem">
      Como dirigente, haz clic en una reunión para cancelarla o reactivarla.
    </p>
  }

  <div class="cal-grid">
    @for (d of diasSemana; track d) { <div class="cal-dow">{{ d }}</div> }
    @for (celda of celdas(); track celda.fecha.getTime()) {
      <div class="cal-celda" [class.otro-mes]="!celda.delMes" [class.hoy]="celda.hoy">
        <div class="cal-num">{{ celda.dia }}</div>
        @for (it of celda.items; track it.key) {
          @if (it.kind === 'reunion') {
            <div class="cal-item cal-reunion" [class.cancelada]="it.cancelada"
                 [class.clickable]="isAdmin()" [title]="tooltipReunion(it)"
                 (click)="toggleReunion(it, celda.fecha)">
              <span class="cal-hora">{{ it.hora }}</span> {{ it.titulo }}
            </div>
          } @else {
            <div class="cal-item cal-evento" [title]="it.titulo + (it.ubicacion ? ' · ' + it.ubicacion : '')">
              <span class="cal-hora">{{ it.hora }}</span> {{ it.titulo }}
            </div>
          }
        }
      </div>
    }
  </div>
</div>
  `,
  styles: [`
    .cal-toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .cal-mes { font-size: 1.1rem; color: #1f2937; text-transform: capitalize; min-width: 170px; text-align: center; }
    .cal-leyenda { margin-left: auto; font-size: 0.78rem; color: #6b7280; display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .dot-general { background: #1d4ed8; }
    .dot-reunion { background: #0d9488; margin-left: 8px; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e5e7eb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .cal-dow { background: #f3f4f6; text-align: center; font-size: 0.74rem; font-weight: 700; color: #6b7280; text-transform: uppercase; padding: 6px 0; }
    .cal-celda { background: #fff; min-height: 96px; padding: 4px 5px; display: flex; flex-direction: column; gap: 3px; }
    .cal-celda.otro-mes { background: #fafafa; }
    .cal-celda.otro-mes .cal-num { color: #cbd5e1; }
    .cal-celda.hoy { outline: 2px solid #1d4ed8; outline-offset: -2px; }
    .cal-num { font-size: 0.78rem; color: #374151; font-weight: 600; }
    .cal-item { font-size: 0.72rem; border-radius: 4px; padding: 2px 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cal-evento { background: #dbeafe; color: #1e3a8a; }
    .cal-reunion { background: #ccfbf1; color: #0f766e; }
    .cal-reunion.clickable { cursor: pointer; }
    .cal-reunion.cancelada { background: #f1f5f9; color: #94a3b8; text-decoration: line-through; }
    .cal-hora { font-weight: 700; }
  `],
})
export class Calendario implements OnInit {
  private readonly eventoSvc = inject(EventoService);
  private readonly agrupacionSvc = inject(AgrupacionService);
  private readonly auth = inject(AuthService);

  protected readonly diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  protected readonly isAdmin = () => {
    const r = this.auth.role();
    return r === 'COMMUNITY_ADMIN' || r === 'PLATFORM_ADMIN';
  };

  mesActual = signal(new Date());
  eventos = signal<Evento[]>([]);
  agrupaciones = signal<Agrupacion[]>([]);

  ngOnInit(): void {
    this.eventoSvc.getAll().subscribe({ next: (e) => this.eventos.set(e) });
    this.agrupacionSvc.getAll().subscribe({ next: (a) => this.agrupaciones.set(a) });
  }

  nombreMes(): string {
    return this.mesActual().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  }

  mes(delta: number): void {
    const d = new Date(this.mesActual());
    d.setMonth(d.getMonth() + delta, 1);
    this.mesActual.set(d);
  }

  irHoy(): void { this.mesActual.set(new Date()); }

  celdas(): Celda[] {
    const base = this.mesActual();
    const y = base.getFullYear();
    const m = base.getMonth();
    const primero = new Date(y, m, 1);
    const offset = (primero.getDay() + 6) % 7;
    const inicio = new Date(y, m, 1 - offset);
    const hoyStr = this.ymd(new Date());
    const fin = new Date(inicio); fin.setDate(inicio.getDate() + 41); fin.setHours(23, 59, 59, 999);
    const eventMap = this.eventosPorDia(inicio, fin);
    const celdas: Celda[] = [];
    for (let i = 0; i < 42; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      celdas.push({
        fecha, dia: fecha.getDate(), delMes: fecha.getMonth() === m,
        hoy: this.ymd(fecha) === hoyStr, items: this.itemsDe(fecha, eventMap),
      });
    }
    return celdas;
  }

  private eventosPorDia(desde: Date, hasta: Date): Map<string, CalItem[]> {
    const map = new Map<string, CalItem[]>();
    for (const o of expandirEventos(this.eventos(), desde, hasta)) {
      const k = this.ymd(o.fechaInicio);
      const item: CalItem = {
        kind: 'evento', key: 'e-' + o.key, titulo: o.evento.titulo,
        hora: this.hhmm(o.fechaInicio), ubicacion: o.evento.ubicacion,
      };
      (map.get(k) ?? map.set(k, []).get(k)!).push(item);
    }
    return map;
  }

  private itemsDe(fecha: Date, eventMap: Map<string, CalItem[]>): CalItem[] {
    const fStr = this.ymd(fecha);
    const items: CalItem[] = [...(eventMap.get(fStr) ?? [])];

    const fIso = this.ymdIso(fecha);
    const isoDow = ((fecha.getDay() + 6) % 7) + 1; // 1=Lunes .. 7=Domingo
    this.agrupaciones().forEach((a) => {
      if (a.reunionDiaSemana !== isoDow) return;
      if (this.enPausa(a, fIso)) return;
      const cancelada = (a.reunionesCanceladas ?? []).includes(fIso);
      items.push({
        kind: 'reunion', key: 'r-' + a.id + '-' + fIso, agrupacionId: a.id,
        titulo: a.nombre, hora: a.reunionHora ? a.reunionHora.slice(0, 5) : '', cancelada,
      });
    });

    return items.sort((x, y) => x.hora.localeCompare(y.hora));
  }

  private enPausa(a: Agrupacion, fStr: string): boolean {
    if (!a.pausaInicio) return false;
    if (fStr < a.pausaInicio) return false;
    if (a.pausaFin && fStr > a.pausaFin) return false;
    return true;
  }

  tooltipReunion(it: CalItem): string {
    const base = 'Reunión · ' + it.titulo + (it.hora ? ' ' + it.hora : '');
    if (!this.isAdmin()) return base + (it.cancelada ? ' (cancelada)' : '');
    return base + (it.cancelada ? ' (cancelada — clic para reactivar)' : ' (clic para cancelar)');
  }

  toggleReunion(it: CalItem, fecha: Date): void {
    if (!this.isAdmin() || !it.agrupacionId) return;
    const fStr = this.ymdIso(fecha);
    const id = it.agrupacionId;
    if (it.cancelada) {
      this.agrupacionSvc.reactivarReunion(id, fStr).subscribe({ next: () => this.setCancelada(id, fStr, false) });
    } else {
      if (!confirm(`¿Cancelar la reunión de "${it.titulo}" del ${fStr}?`)) return;
      this.agrupacionSvc.cancelarReunion(id, fStr).subscribe({ next: () => this.setCancelada(id, fStr, true) });
    }
  }

  private setCancelada(agrupacionId: string, fStr: string, cancelada: boolean): void {
    this.agrupaciones.update((prev) => prev.map((a) => {
      if (a.id !== agrupacionId) return a;
      const set = new Set(a.reunionesCanceladas ?? []);
      if (cancelada) set.add(fStr); else set.delete(fStr);
      return { ...a, reunionesCanceladas: [...set] };
    }));
  }

  private hhmm(d: Date): string {
    return d.toTimeString().slice(0, 5);
  }

  /** Clave local para comparar por día (mes 0-based, sin padding). */
  private ymd(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  /** Fecha ISO yyyy-MM-dd para el backend. */
  private ymdIso(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}
