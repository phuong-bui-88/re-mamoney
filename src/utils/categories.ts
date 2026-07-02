export const INCOME_CATEGORIES = [
  'salary', 'bonus', 'freelance', 'investment', 'other',
] as const;

export const EXPENSE_CATEGORIES = [
  'food', 'transport', 'utilities', 'entertainment', 'health', 'shopping', 'other',
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
  salary: 'cash-outline',
  bonus: 'gift-outline',
  freelance: 'briefcase-outline',
  investment: 'trending-up-outline',
  food: 'restaurant-outline',
  transport: 'car-outline',
  utilities: 'bulb-outline',
  entertainment: 'film-outline',
  health: 'medkit-outline',
  shopping: 'cart-outline',
  other: 'ellipsis-horizontal-outline',
};

export const CATEGORY_COLORS: Record<string, string> = {
  salary: '#00BFA5',
  bonus: '#E91E63',
  freelance: '#9C27B0',
  investment: '#2196F3',
  food: '#FF6384',
  transport: '#36A2EB',
  utilities: '#FFCE56',
  entertainment: '#4BC0C0',
  health: '#FF9F40',
  shopping: '#9966FF',
  other: '#607D8B',
};

export const FALLBACK_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#00BFA5', '#E91E63', '#9C27B0', '#2196F3',
];
