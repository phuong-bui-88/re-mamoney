export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, '').trim().toLowerCase();

  const patterns: Array<{ regex: RegExp; multiplier: number }> = [
    { regex: /(\d+(?:\.\d+)?)\s*k\b/, multiplier: 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*m\b/, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*triệu/, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*tr\b/, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*tỉ\b/, multiplier: 1000000000 },
    { regex: /(\d+(?:\.\d+)?)\s*b\b/, multiplier: 1000000000 },
    { regex: /(\d+(?:\.\d+)?)\s*thousand/, multiplier: 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*million/, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*billion/, multiplier: 1000000000 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = cleaned.match(regex);
    if (match) {
      const value = parseFloat(match[1]);
      return Math.round(value * multiplier);
    }
  }

  const plainNumberMatch = cleaned.match(/(\d+)/);
  if (plainNumberMatch) {
    return parseInt(plainNumberMatch[1], 10);
  }

  return null;
}
