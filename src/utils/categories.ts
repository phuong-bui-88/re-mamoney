export const INCOME_CATEGORIES = [
  'salary',
  'bonus',
  'freelance',
  'investment',
  'other',
] as const;

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'utilities',
  'entertainment',
  'health',
  'shopping',
  'other',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salary',
  bonus: 'Bonus',
  freelance: 'Freelance',
  investment: 'Investment',
  food: 'Food & Dining',
  transport: 'Transport',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  health: 'Health & Medical',
  shopping: 'Shopping',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<string, string> = {
  salary: '💰',
  bonus: '🎁',
  freelance: '💼',
  investment: '📈',
  food: '🍔',
  transport: '🚗',
  utilities: '💡',
  entertainment: '🎬',
  health: '🏥',
  shopping: '🛍️',
  other: '📌',
};
