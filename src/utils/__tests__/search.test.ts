import { normalizeSearchText, matchesSearch } from '@utils/search';
import type { Transaction } from '@/types';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense',
  amount: 50000,
  category: 'food',
  description: '',
  date: new Date('2026-07-15T10:00:00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('search utils', () => {
  describe('normalizeSearchText', () => {
    it('lowercases text', () => {
      expect(normalizeSearchText('Banh Mi')).toBe('banh mi');
    });

    it('strips Vietnamese diacritics', () => {
      expect(normalizeSearchText('Bánh tráng cuốn')).toBe('banh trang cuon');
      expect(normalizeSearchText('Cà phê sữa')).toBe('ca phe sua');
    });

    it('maps đ to d in both cases', () => {
      expect(normalizeSearchText('Đường')).toBe('duong');
      expect(normalizeSearchText('đá')).toBe('da');
    });
  });

  describe('matchesSearch', () => {
    it('matches description case-insensitively and diacritic-insensitively', () => {
      const tx = makeTransaction({ description: 'Bánh tráng cuốn' });
      expect(matchesSearch(tx, 'banh trang cuon')).toBe(true);
      expect(matchesSearch(tx, 'BANH TRANG CUON')).toBe(true);
    });

    it('ignores userText even when it contains the query', () => {
      const tx = makeTransaction({ description: 'Snack', userText: 'trang cuon set' });
      expect(matchesSearch(tx, 'cuon set')).toBe(false);
    });

    it('ignores category', () => {
      const tx = makeTransaction({ description: 'Kẹo', category: 'food' });
      expect(matchesSearch(tx, 'food')).toBe(false);
    });

    it('does not match a transaction whose shared userText contains the query (Kẹo regression)', () => {
      const tx = makeTransaction({ description: 'Kẹo', userText: 'chè mè đen' });
      expect(matchesSearch(tx, 'che')).toBe(false);
    });

    it('returns false when nothing matches', () => {
      const tx = makeTransaction({ description: 'Coffee', userText: 'cf', category: 'food' });
      expect(matchesSearch(tx, 'banh trang')).toBe(false);
    });

    it('treats blank or whitespace-only query as match-all', () => {
      const tx = makeTransaction();
      expect(matchesSearch(tx, '')).toBe(true);
      expect(matchesSearch(tx, '   ')).toBe(true);
    });
  });
});
