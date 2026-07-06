import { Evento, Frecuencia } from '../community/evento.models';

/** Una ocurrencia concreta de un evento (puntual o recurrente) dentro de un rango. */
export interface Ocurrencia {
  evento: Evento;
  fechaInicio: Date;
  fechaFin: Date | null;
  /** Clave única por instancia (sirve como track/id en listados). */
  key: string;
}

/** Expande un evento en sus ocurrencias dentro de [rangoIni, rangoFin] (ambos inclusive). */
export function expandirEvento(ev: Evento, rangoIni: Date, rangoFin: Date): Ocurrencia[] {
  const inicioBase = new Date(ev.fechaInicio);
  const finBase = ev.fechaFin ? new Date(ev.fechaFin) : null;
  const durMs = finBase ? finBase.getTime() - inicioBase.getTime() : 0;

  if (!ev.recurrente || !ev.frecuencia) {
    if (inicioBase >= rangoIni && inicioBase <= rangoFin) {
      return [{ evento: ev, fechaInicio: inicioBase, fechaFin: finBase, key: ev.id }];
    }
    return [];
  }

  const paso = Math.max(1, ev.intervalo ?? 1);
  const hasta = ev.recurrenciaFin ? new Date(ev.recurrenciaFin + 'T23:59:59') : null;
  const tope = hasta && hasta < rangoFin ? hasta : rangoFin;

  const out: Ocurrencia[] = [];
  let cursor = new Date(inicioBase);
  // Salto rápido hacia el rango para no iterar desde un inicio muy lejano (frecuencias de longitud fija).
  if (cursor < rangoIni && (ev.frecuencia === 'DIARIA' || ev.frecuencia === 'SEMANAL')) {
    const unidad = ev.frecuencia === 'DIARIA' ? 86400000 : 7 * 86400000;
    const stepMs = unidad * paso;
    const saltos = Math.floor((rangoIni.getTime() - cursor.getTime()) / stepMs);
    if (saltos > 0) cursor = new Date(cursor.getTime() + saltos * stepMs);
  }
  let guard = 0;
  while (cursor <= tope && guard < 1000) {
    guard++;
    if (cursor >= rangoIni) {
      const fin = durMs ? new Date(cursor.getTime() + durMs) : null;
      out.push({ evento: ev, fechaInicio: new Date(cursor), fechaFin: fin, key: `${ev.id}@${cursor.toISOString()}` });
    }
    cursor = avanzar(cursor, ev.frecuencia, paso);
  }
  return out;
}

/** Expande una lista de eventos y devuelve las ocurrencias ordenadas por fecha. */
export function expandirEventos(eventos: Evento[], rangoIni: Date, rangoFin: Date): Ocurrencia[] {
  return eventos
    .flatMap((e) => expandirEvento(e, rangoIni, rangoFin))
    .sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());
}

function avanzar(d: Date, f: Frecuencia, n: number): Date {
  const r = new Date(d);
  switch (f) {
    case 'DIARIA': r.setDate(r.getDate() + n); break;
    case 'SEMANAL': r.setDate(r.getDate() + 7 * n); break;
    case 'MENSUAL': r.setMonth(r.getMonth() + n); break;
    case 'ANUAL': r.setFullYear(r.getFullYear() + n); break;
  }
  return r;
}

/** Etiqueta legible de la regla de recurrencia (ej: "Semanal", "Cada 2 meses"). */
export function etiquetaRecurrencia(ev: Evento): string {
  if (!ev.recurrente || !ev.frecuencia) return '';
  const n = Math.max(1, ev.intervalo ?? 1);
  const base: Record<Frecuencia, [string, string]> = {
    DIARIA: ['Todos los días', `Cada ${n} días`],
    SEMANAL: ['Cada semana', `Cada ${n} semanas`],
    MENSUAL: ['Cada mes', `Cada ${n} meses`],
    ANUAL: ['Cada año', `Cada ${n} años`],
  };
  return n === 1 ? base[ev.frecuencia][0] : base[ev.frecuencia][1];
}
