const VND_LOCALE = 'vi-VN';
const VND_CURRENCY = 'VND';

/**
 * Format a number as Vietnamese Dong currency
 * @param amount The amount to format
 * @returns Formatted currency string (e.g., "1.000.000 ₫")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(VND_LOCALE, {
    style: 'currency',
    currency: VND_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Parse a formatted currency string back to a number
 * @param formatted The formatted currency string
 * @returns The numeric value
 */
export const parseCurrency = (formatted: string): number => {
  const cleaned = formatted.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param format The format pattern (default: "dd/MM/yyyy")
 * @returns Formatted date string
 */
export const formatDate = (date: Date, format: string = 'dd/MM/yyyy'): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year.toString());
};

/**
 * Get the start of the current month
 */
export const getMonthStart = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the end of the current month
 */
export const getMonthEnd = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Get the start of the current year
 */
export const getYearStart = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

/**
 * Get the end of the current year
 */
export const getYearEnd = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), 11, 31);
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};
