import { parseLocalTransactions } from '@utils/localTransactionParser';

describe('parseLocalTransactions', () => {
  const today = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  })();

  it('parses a single shorthand item', () => {
    const result = parseLocalTransactions('coffee 30k');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      description: 'coffee',
      amount: 30000,
      category: 'food',
      type: 'expense',
      date: today,
    });
  });

  it('parses multi-item shorthand with space separator', () => {
    const result = parseLocalTransactions('bánh canh 20k cơm gà 15k');
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('bánh canh');
    expect(result[0].amount).toBe(20000);
    expect(result[1].description).toBe('cơm gà');
    expect(result[1].amount).toBe(15000);
  });

  it('parses comma-separated items', () => {
    const result = parseLocalTransactions('lunch 80k, taxi 120k');
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('lunch');
    expect(result[0].amount).toBe(80000);
    expect(result[1].description).toBe('taxi');
    expect(result[1].amount).toBe(120000);
  });

  it('handles decimal amounts (e.g. 2.5k)', () => {
    const result = parseLocalTransactions('water 2.5k');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(2500);
  });

  it('handles m suffix (millions)', () => {
    const result = parseLocalTransactions('rent 5m');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(5000000);
  });

  it('handles tr suffix (triệu)', () => {
    const result = parseLocalTransactions('rent 5tr');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(5000000);
  });

  it('handles mixed k and m in same input', () => {
    const result = parseLocalTransactions('coffee 30k dinner 2.5m');
    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(30000);
    expect(result[1].amount).toBe(2500000);
  });

  it('returns empty array for input with no amounts', () => {
    expect(parseLocalTransactions('hello world')).toEqual([]);
  });

  it('returns empty array for amount-only input without description', () => {
    const result = parseLocalTransactions('50k');
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Unknown');
    expect(result[0].amount).toBe(50000);
  });

  it('returns empty array for empty input', () => {
    expect(parseLocalTransactions('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(parseLocalTransactions('   ')).toEqual([]);
  });

  it('handles mixed comma and space separators', () => {
    const result = parseLocalTransactions('a 10k, b 20k c 30k');
    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(10000);
    expect(result[1].amount).toBe(20000);
    expect(result[2].amount).toBe(30000);
  });

  it('filters out zero-amount items', () => {
    const result = parseLocalTransactions('coffee 0k');
    expect(result).toEqual([]);
  });

  it('all items default to expense type and food category', () => {
    const result = parseLocalTransactions('a 10k b 20k');
    result.forEach((tx) => {
      expect(tx.type).toBe('expense');
      expect(tx.category).toBe('food');
    });
  });

  it('handles Vietnamese text in descriptions', () => {
    const result = parseLocalTransactions('phở bò 35k trà sữa 25k');
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('phở bò');
    expect(result[0].amount).toBe(35000);
    expect(result[1].description).toBe('trà sữa');
    expect(result[1].amount).toBe(25000);
  });

  it('handles uppercase K suffix', () => {
    const result = parseLocalTransactions('coffee 30K');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(30000);
  });
});
