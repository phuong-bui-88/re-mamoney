import { getCardWindow, findMatchingLineIndex, findMatchingLineIndices } from '../rawLinesWindow';

describe('getCardWindow', () => {
  const lines = [
    'Hủ tiếu 25 K',
    'Cơm 60k',
    'Cơm sườn 86 ca',
    'Kẹo 16k',
    'Dầu gió 86 k',
    'Khoai lang 11 K',
    'Hủ tiếu 25 K',
    'Bánh bèo 15k',
  ];

  it('uses page 0 (lines 0-4) for matches 0 through 4', () => {
    for (const match of [0, 1, 2, 3, 4]) {
      const result = getCardWindow(lines, match, -1);
      expect(result.start).toBe(0);
      expect(result.end).toBe(5);
      expect(result.lines).toEqual(lines.slice(0, 5));
      expect(result.lines[match - result.start]).toBe(lines[match]);
    }
  });

  it('jumps to page 4 (lines 4-7) for matches 5 through 7', () => {
    for (const match of [5, 6, 7]) {
      const result = getCardWindow(lines, match, -1);
      expect(result.start).toBe(4);
      expect(result.end).toBe(8);
      expect(result.lines).toEqual(lines.slice(4, 8));
    }
  });

  it('active line stays within rows 1-5 across all matches', () => {
    for (let match = 0; match < lines.length; match++) {
      const result = getCardWindow(lines, match, -1);
      const row = match - result.start + 1;
      expect(row).toBeGreaterThanOrEqual(1);
      expect(row).toBeLessThanOrEqual(5);
      expect(result.lines[row - 1]).toBe(lines[match]);
    }
  });

  it('ignores prevMatchIdx for matched cards', () => {
    expect(getCardWindow(lines, 5, 0)).toEqual(getCardWindow(lines, 5, -1));
  });

  it('shows up to 5 lines after the previous match when current does not match', () => {
    const result = getCardWindow(lines, -1, 3);
    expect(result.start).toBe(4);
    expect(result.end).toBe(8);
    expect(result.lines).toEqual(lines.slice(4, 8));
  });

  it('shows the first 5 lines when unmatched and no previous match', () => {
    const result = getCardWindow(lines, -1, -1);
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
    expect(result.lines).toEqual(lines.slice(0, 5));
  });

  it('returns an empty window for empty lines', () => {
    const result = getCardWindow([], 0, -1);
    expect(result.start).toBe(0);
    expect(result.end).toBe(0);
    expect(result.lines).toEqual([]);
  });
});

describe('getCardWindow - page sequence', () => {
  const paste13 = [
    'Hủ tiếu 25k',
    'Chè mè đen 15k',
    'Hủ tiếu 25k',
    'Hủ tiếu 25 K',
    'Bánh mì 30 K',
    'Hủ tiếu 25 K',
    'Cơm 60k',
    'Cơm sườn 30k',
    'Kẹo 16k',
    'Dầu gió 20k',
    'Khoai lang 20k',
    'Hủ tiếu 25 K',
    'Bánh bèo 15k',
  ];

  it('13-line paste: matches 0-12 page through [0-4]x5 / [4-8]x4 / [8-12]x4', () => {
    const expectedStarts = [0, 0, 0, 0, 0, 4, 4, 4, 4, 8, 8, 8, 8];
    const expectedRows = [1, 2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5];
    let prevMatch = -1;

    for (let match = 0; match < paste13.length; match++) {
      const result = getCardWindow(paste13, match, prevMatch);
      expect(result.start).toBe(expectedStarts[match]);
      expect(result.end).toBe(expectedStarts[match] + 5);
      expect(result.lines).toEqual(paste13.slice(result.start, result.end));

      const row = match - result.start + 1;
      expect(row).toBe(expectedRows[match]);
      expect(result.lines[row - 1]).toBe(paste13[match]);

      prevMatch = match;
    }
  });

  it('6-line paste: matches 0-4 → [0-4], match 5 → [4-5] (clamped to paste end)', () => {
    const paste6 = [
      'Hủ tiếu 25k',
      'Hủ tiếu 25k',
      'Đổ xăng 50k',
      'Đổi bình nước 50 K',
      'Đặt xe 40 K',
      'Bánh tráng trộn 20k',
    ];
    const expectedStarts = [0, 0, 0, 0, 0, 4];
    const expectedEnds = [5, 5, 5, 5, 5, 6];

    for (let match = 0; match < paste6.length; match++) {
      const result = getCardWindow(paste6, match, match - 1);
      expect(result.start).toBe(expectedStarts[match]);
      expect(result.end).toBe(expectedEnds[match]);
      expect(result.lines).toEqual(paste6.slice(result.start, result.end));
      expect(result.lines[match - result.start]).toBe(paste6[match]);
    }
  });
});

describe('findMatchingLineIndex', () => {
  const lines = [
    'Hủ tiếu 25 K',
    'Cơm 60k',
    'Cơm sườn 86 ca',
    'Kẹo 16k',
    'Dầu gió 86 k',
    'Khoai lang 11 K',
    'Hủ tiếu 25 K',
    'Bánh bèo 15k',
  ];

  it('finds matching line by description', () => {
    expect(findMatchingLineIndex(lines, 'Kẹo', 16000)).toBe(3);
  });

  it('finds first matching line when duplicates exist', () => {
    expect(findMatchingLineIndex(lines, 'Hủ tiếu', 25000)).toBe(0);
  });

  it('returns -1 when no match found', () => {
    expect(findMatchingLineIndex(lines, 'Pizza', 50000)).toBe(-1);
  });

  it('finds by amount when description does not match', () => {
    const amountLines = ['Hủ tiếu 25 K', 'Cơm 60k', 'Đặt xe 40.000'];
    expect(findMatchingLineIndex(amountLines, 'Unknown', 40000)).toBe(2);
  });

  it('returns -1 for empty lines', () => {
    expect(findMatchingLineIndex([], 'test', 100)).toBe(-1);
  });

  it('skips lines already excluded in the description pass', () => {
    const excluded = new Set<number>([0]);
    expect(findMatchingLineIndex(lines, 'Hủ tiếu', 25000, excluded)).toBe(6);
  });

  it('skips lines already excluded in the amount pass', () => {
    const amountLines = ['Đặt xe 40.000'];
    const excluded = new Set<number>([0]);
    expect(findMatchingLineIndex(amountLines, 'Unknown', 40000, excluded)).toBe(-1);
  });
});

describe('findMatchingLineIndices', () => {
  const lines = [
    'Hủ tiếu 25 K',
    'Hủ tiếu 25 K',
    'Đổ xăng 50k',
    'Đổi bình nước 50 K',
    'Đặt xe 40 K',
  ];

  it('assigns distinct lines to duplicate descriptions in order', () => {
    const items = [
      { description: 'Hủ tiếu', amount: 25000 },
      { description: 'Hủ tiếu', amount: 25000 },
      { description: 'Đổ xăng', amount: 50000 },
    ];
    expect(findMatchingLineIndices(items, lines)).toEqual([0, 1, 2]);
  });

  it('leaves unmatched items as -1 without consuming lines', () => {
    const items = [
      { description: 'Pizza', amount: 20000 },
      { description: 'Hủ tiếu', amount: 25000 },
    ];
    expect(findMatchingLineIndices(items, lines)).toEqual([-1, 0]);
  });

  it('returns empty array for empty items', () => {
    expect(findMatchingLineIndices([], lines)).toEqual([]);
  });
});
