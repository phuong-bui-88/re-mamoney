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
  const amountTokenRe = /\b(\d+(?:\.\d+)?)\s*(k|m|tr|t|triệu)\b/gi;

  const amounts: Array<{ value: number; suffix: string; index: number; length: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = amountTokenRe.exec(normalized)) !== null) {
    amounts.push({
      value: parseFloat(m[1]),
      suffix: m[2].toLowerCase(),
      index: m.index,
      length: m[0].length,
    });
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
        amount = value * 1000;
        break;
      case 'm':
        amount = value * 1000000;
        break;
      case 'tr':
      case 't':
      case 'triệu':
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
