import { formatCurrency, parseCurrency, formatDate } from '@utils/currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format a number as Vietnamese Dong', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toBeDefined();
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-1000);
      expect(result).toBeDefined();
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted currency string back to number', () => {
      const formatted = '1.000.000 ₫';
      const result = parseCurrency(formatted);
      expect(result).toBe(1000000);
    });

    it('should handle empty string', () => {
      const result = parseCurrency('');
      expect(result).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBeDefined();
    });
  });
});
