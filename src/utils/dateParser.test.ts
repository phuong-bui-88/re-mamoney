import { parseDate } from '@utils/dateParser';

describe('dateParser', () => {
  it('should parse valid DD-MM-YYYY', () => {
    const d = parseDate('15-01-2024');
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(15);
    expect(d!.getMonth()).toBe(0);
    expect(d!.getFullYear()).toBe(2024);
  });

  it('should return null for invalid day', () => {
    expect(parseDate('32-01-2024')).toBeNull();
  });

  it('should return null for invalid month', () => {
    expect(parseDate('15-13-2024')).toBeNull();
  });

  it('should return null for non-date string', () => {
    expect(parseDate('abc')).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate('15/01/2024')).toBeNull();
  });

  it('should handle leap year Feb 29', () => {
    const d = parseDate('29-02-2024');
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(29);
    expect(d!.getMonth()).toBe(1);
  });

  it('should reject Feb 29 in non-leap year', () => {
    expect(parseDate('29-02-2023')).toBeNull();
  });

  it('should handle end of month', () => {
    expect(parseDate('31-01-2024')).not.toBeNull();
    expect(parseDate('31-04-2024')).toBeNull();
  });
});
