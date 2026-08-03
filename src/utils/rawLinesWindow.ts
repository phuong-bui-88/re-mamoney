const MAX_VISIBLE_LINES = 5;
const PAGE_STRIDE = 4;

export interface RawLinesWindow {
  start: number;
  end: number;
  lines: string[];
}

export function getCardWindow(
  rawLines: string[],
  matchIdx: number,
  prevMatchIdx: number,
): RawLinesWindow {
  const total = rawLines.length;
  if (total === 0) {
    return { start: 0, end: 0, lines: [] };
  }

  let start: number;
  let end: number;

  if (matchIdx >= 0) {
    start = Math.max(0, PAGE_STRIDE * Math.floor((matchIdx - 1) / PAGE_STRIDE));
    end = Math.min(total, start + MAX_VISIBLE_LINES);
  } else {
    start = prevMatchIdx + 1;
    if (start < 0) {
      start = 0;
    }
    end = Math.min(total, start + MAX_VISIBLE_LINES);
  }

  return { start, end, lines: rawLines.slice(start, end) };
}

export function findMatchingLineIndex(
  rawLines: string[],
  description: string,
  amount: number,
  excluded: ReadonlySet<number> = new Set(),
): number {
  const descLower = (description || '').toLowerCase();
  const amountStr = String(amount);

  for (let i = 0; i < rawLines.length; i++) {
    if (excluded.has(i)) continue;
    const line = rawLines[i].toLowerCase();
    if (descLower && line.includes(descLower)) {
      return i;
    }
  }

  for (let i = 0; i < rawLines.length; i++) {
    if (excluded.has(i)) continue;
    const line = rawLines[i].replace(/[.,\s]/g, '');
    if (line.includes(amountStr)) {
      return i;
    }
  }

  return -1;
}

export interface MatchableItem {
  description?: string;
  amount?: number;
}

export function findMatchingLineIndices(
  items: MatchableItem[],
  rawLines: string[],
): number[] {
  const excluded = new Set<number>();
  return items.map((item) => {
    const idx = findMatchingLineIndex(rawLines, item.description || '', item.amount || 0, excluded);
    if (idx >= 0) {
      excluded.add(idx);
    }
    return idx;
  });
}
