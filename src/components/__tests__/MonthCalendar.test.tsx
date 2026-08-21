import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react-native';
import MonthCalendar from '@components/MonthCalendar';
import type { Transaction } from '@/types';

const tx = (id: string, date: Date, type: 'income' | 'expense', amount: number): Transaction => ({
  id,
  userId: 'u',
  type,
  amount,
  category: 'food',
  description: 'x',
  date,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const defaultProps = {
  month: 6,
  year: 2026,
  transactions: [] as Transaction[],
  onMonthChange: jest.fn(),
  onYearChange: jest.fn(),
  selectedDay: null as number | null,
  onDayPress: jest.fn(),
};

const collectTexts = (
  toJSONResult: ReturnType<typeof render>['toJSON'] extends () => infer R ? R : never
): string[] => {
  const texts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const n = node as { children?: unknown[] };
    if (n.children) n.children.forEach(walk);
    if (typeof node === 'string' || typeof node === 'number') texts.push(String(node));
  };
  walk(toJSONResult);
  return texts;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 6, 15, 12, 0, 0));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('MonthCalendar', () => {
  it('renders month and year in the header', () => {
    render(<MonthCalendar {...defaultProps} />);

    expect(screen.getByText('Jul 2026')).toBeTruthy();
  });

  it('renders monday-first weekday header', () => {
    render(<MonthCalendar {...defaultProps} />);

    ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].forEach((w) => {
      expect(screen.getByText(w)).toBeTruthy();
    });
  });

  it('renders correct number of days for a 31-day month', () => {
    render(<MonthCalendar {...defaultProps} month={7} />);

    expect(screen.queryAllByTestId(/^day-\d+$/)).toHaveLength(31);
  });

  it('renders 28 days for non-leap February', () => {
    render(<MonthCalendar {...defaultProps} month={1} />);

    expect(screen.queryAllByTestId(/^day-\d+$/)).toHaveLength(28);
  });

  it('renders 29 days for leap-year February', () => {
    render(<MonthCalendar {...defaultProps} month={1} year={2024} />);

    expect(screen.queryAllByTestId(/^day-\d+$/)).toHaveLength(29);
  });

  it('aligns first day to the correct weekday column (Aug 2026 starts Saturday)', () => {
    const { toJSON } = render(<MonthCalendar {...defaultProps} month={7} />);
    const texts = collectTexts(toJSON());

    expect(texts.indexOf('1') - texts.indexOf('Su')).toBe(1);
  });

  it('shows compact net amount on days with transactions', () => {
    const transactions = [
      tx('t1', new Date(2026, 6, 10, 12), 'expense', 20000),
      tx('t2', new Date(2026, 6, 11, 9), 'income', 50000),
    ];
    render(<MonthCalendar {...defaultProps} transactions={transactions} />);

    expect(within(screen.getByTestId('day-10')).getByText('-20k')).toBeTruthy();
    expect(within(screen.getByTestId('day-11')).getByText('+50k')).toBeTruthy();
  });

  it('formats millions compactly and small amounts as-is', () => {
    const transactions = [
      tx('m1', new Date(2026, 6, 20, 12), 'income', 1500000),
      tx('s1', new Date(2026, 6, 25, 12), 'income', 500),
    ];
    render(<MonthCalendar {...defaultProps} transactions={transactions} />);

    expect(within(screen.getByTestId('day-20')).getByText('+1.5M')).toBeTruthy();
    expect(within(screen.getByTestId('day-25')).getByText('+500')).toBeTruthy();
  });

  it('shows zero net without sign when income equals expense on a day', () => {
    const transactions = [
      tx('z1', new Date(2026, 6, 22, 8), 'income', 10000),
      tx('z2', new Date(2026, 6, 22, 14), 'expense', 10000),
    ];
    render(<MonthCalendar {...defaultProps} transactions={transactions} />);

    expect(within(screen.getByTestId('day-22')).getByText('0')).toBeTruthy();
  });

  it('does not show amount on days without transactions', () => {
    const transactions = [tx('t1', new Date(2026, 6, 10, 12), 'expense', 20000)];
    render(<MonthCalendar {...defaultProps} transactions={transactions} />);

    expect(within(screen.getByTestId('day-12')).queryByText(/k/)).toBeNull();
  });

  it('ignores transactions outside the displayed month', () => {
    const transactions = [tx('june', new Date(2026, 5, 10, 12), 'expense', 20000)];
    render(<MonthCalendar {...defaultProps} transactions={transactions} />);

    expect(within(screen.getByTestId('day-10')).queryByText(/k/)).toBeNull();
  });

  it('highlights today with circle in current month', () => {
    render(<MonthCalendar {...defaultProps} />);

    expect(within(screen.getByTestId('day-15')).getByTestId('today-circle')).toBeTruthy();
  });

  it('does not highlight today when displaying another month', () => {
    render(<MonthCalendar {...defaultProps} month={7} />);

    expect(screen.queryByTestId('today-circle')).toBeNull();
  });

  it('highlights the selected day', () => {
    render(<MonthCalendar {...defaultProps} selectedDay={18} />);

    expect(within(screen.getByTestId('day-18')).getByTestId('selected-circle')).toBeTruthy();
    expect(within(screen.getByTestId('day-17')).queryByTestId('selected-circle')).toBeNull();
  });

  it('calls onDayPress with the day number when tapped', () => {
    const onDayPress = jest.fn();
    render(<MonthCalendar {...defaultProps} onDayPress={onDayPress} />);

    fireEvent.press(screen.getByTestId('day-18'));

    expect(onDayPress).toHaveBeenCalledWith(18);
  });

  it('calls onDayPress with null when the active day is tapped again', () => {
    const onDayPress = jest.fn();
    render(<MonthCalendar {...defaultProps} selectedDay={18} onDayPress={onDayPress} />);

    fireEvent.press(screen.getByTestId('day-18'));

    expect(onDayPress).toHaveBeenCalledWith(null);
  });

  it('opens picker modal from header', () => {
    render(<MonthCalendar {...defaultProps} />);

    fireEvent.press(screen.getByTestId('calendar-header'));

    expect(screen.getByText('Select Month & Year')).toBeTruthy();
  });

  it('calls onMonthChange when a month is picked', () => {
    const onMonthChange = jest.fn();
    render(<MonthCalendar {...defaultProps} onMonthChange={onMonthChange} />);

    fireEvent.press(screen.getByTestId('calendar-header'));
    fireEvent.press(screen.getByText('Aug'));

    expect(onMonthChange).toHaveBeenCalledWith(7);
  });

  it('calls onYearChange when a year is picked', () => {
    const onYearChange = jest.fn();
    render(<MonthCalendar {...defaultProps} onYearChange={onYearChange} />);

    fireEvent.press(screen.getByTestId('calendar-header'));
    fireEvent.press(screen.getByText('2025'));

    expect(onYearChange).toHaveBeenCalledWith(2025);
  });

  it('marks active month in the picker grid', () => {
    render(<MonthCalendar {...defaultProps} />);

    fireEvent.press(screen.getByTestId('calendar-header'));

    const julItem = screen.getByText('Jul');
    expect(julItem.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontWeight: '700' })])
    );
  });
});
