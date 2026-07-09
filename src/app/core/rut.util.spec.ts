import { validarRut, formatearRut } from './rut.util';

describe('rut.util', () => {
  describe('validarRut', () => {
    it('acepta un RUT válido con puntos y guion', () => {
      expect(validarRut('12.345.678-5')).toBe(true);
    });

    it('acepta el mismo RUT sin formato', () => {
      expect(validarRut('123456785')).toBe(true);
    });

    it('rechaza un dígito verificador incorrecto', () => {
      expect(validarRut('12.345.678-9')).toBe(false);
    });

    it('rechaza nulo, vacío o demasiado corto', () => {
      expect(validarRut(null)).toBe(false);
      expect(validarRut('')).toBe(false);
      expect(validarRut('1')).toBe(false);
    });

    it('rechaza un cuerpo no numérico', () => {
      expect(validarRut('ABC.DEF-1')).toBe(false);
    });
  });

  describe('formatearRut', () => {
    it('formatea a 12.345.678-5', () => {
      expect(formatearRut('123456785')).toBe('12.345.678-5');
    });

    it('devuelve vacío para nulo', () => {
      expect(formatearRut(null)).toBe('');
    });
  });
});
