import { expandirEvento, etiquetaRecurrencia } from './recurrence.util';
import { Evento } from '../community/evento.models';

function evento(parcial: Partial<Evento>): Evento {
  return { id: 'e1', titulo: 'Test', fechaInicio: '2026-07-10T10:00:00', fechaFin: null,
           recurrente: false, frecuencia: null, ...parcial } as unknown as Evento;
}

describe('recurrence.util', () => {
  describe('etiquetaRecurrencia', () => {
    it('devuelve vacío si el evento no es recurrente', () => {
      expect(etiquetaRecurrencia(evento({ recurrente: false }))).toBe('');
    });

    it('etiqueta "Todos los días" para diaria con intervalo 1', () => {
      expect(etiquetaRecurrencia(evento({ recurrente: true, frecuencia: 'DIARIA', intervalo: 1 })))
        .toBe('Todos los días');
    });

    it('etiqueta "Cada 2 semanas" para semanal con intervalo 2', () => {
      expect(etiquetaRecurrencia(evento({ recurrente: true, frecuencia: 'SEMANAL', intervalo: 2 })))
        .toBe('Cada 2 semanas');
    });
  });

  describe('expandirEvento', () => {
    it('evento no recurrente dentro del rango → 1 ocurrencia', () => {
      const oc = expandirEvento(evento({}), new Date('2026-07-01'), new Date('2026-07-31T23:59:59'));
      expect(oc).toHaveLength(1);
    });

    it('evento no recurrente fuera del rango → 0 ocurrencias', () => {
      const oc = expandirEvento(evento({}), new Date('2026-08-01'), new Date('2026-08-31T23:59:59'));
      expect(oc).toHaveLength(0);
    });

    it('evento diario expande una ocurrencia por día dentro del rango', () => {
      const ev = evento({ recurrente: true, frecuencia: 'DIARIA', intervalo: 1, fechaInicio: '2026-07-10T10:00:00' });
      const oc = expandirEvento(ev, new Date('2026-07-10T00:00:00'), new Date('2026-07-14T23:59:59'));
      expect(oc).toHaveLength(5); // 10, 11, 12, 13, 14
    });
  });
});
