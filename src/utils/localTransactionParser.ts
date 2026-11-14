import { AITransaction } from '@/types';

const TODAY_DDMMYYYY = (() => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
})();

export function parseLocalTransactions(input: string): AITransaction[] {
  const normalized = input.replace(/,/g, ' ').trim();
  // number + OPTIONAL suffix; dotted thousands ("150.000") are matched first
  const amountTokenRe =
    /(?<![\w.])(\d{1,3}(?:\.\d{3})+|\d+(?:\.\d+)?)\s*(k|m|triệu|trieu|tr|t|ca|đ|d|vnd)?(?![\p{L}\d])/giu;
  const DOTTED_THOUSANDS_RE = /^\d{1,3}(?:\.\d{3})+$/;
  const MIN_BARE_AMOUNT = 1000;

  const amounts: Array<{ value: number; suffix: string; index: number; length: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = amountTokenRe.exec(normalized)) !== null) {
    const raw = m[1];
    const suffix = (m[2] ?? '').toLowerCase();
    const value =
      !suffix && DOTTED_THOUSANDS_RE.test(raw)
        ? parseInt(raw.replace(/\./g, ''), 10)
        : parseFloat(raw);

    // A bare number is only an amount when it is big enough ("2 people" is not money)
    if (!suffix && value < MIN_BARE_AMOUNT) continue;

    amounts.push({ value, suffix, index: m.index, length: m[0].length });
  }

  if (amounts.length === 0) return [];

  const items: AITransaction[] = [];

  for (let i = 0; i < amounts.length; i++) {
    const start = i === 0 ? 0 : amounts[i - 1].index + amounts[i - 1].length;
    const end = amounts[i].index;
    const desc = normalized.slice(start, end).trim();

    const { value, suffix } = amounts[i];
    let amount: number;
    switch (suffix) {
      case 'k':
      case 'ca':
        amount = value * 1000;
        break;
      case 'm':
        amount = value * 1000000;
        break;
      case 'tr':
      case 't':
      case 'triệu':
      case 'trieu':
        amount = value * 1000000;
        break;
      default:
        amount = value;
    }

    items.push({
      description: desc || 'Unknown',
      amount: Math.round(amount),
      category: 'food',
      type: 'expense',
      date: TODAY_DDMMYYYY,
    });
  }

  return items.filter((tx) => tx.amount > 0);
}
