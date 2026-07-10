import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MonthlyChart from '@components/MonthlyChart';
import { useTransactionStore } from '@store/index';
import { formatCurrency } from '@utils/currency';

const mockTransaction = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense' as const,
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date('2026-07-15T10:00:00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

jest.mock('react-native-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: function SvgMock({ children }: { children?: React.ReactNode }) {
      return React.createElement(View, null, children);
    },
    Svg: function SvgMock({ children }: { children?: React.ReactNode }) {
      return React.createElement(View, null, children);
    },
    G: function GMock({ onPress, children }: { onPress?: () => void; children?: React.ReactNode }) {
      if (onPress) {
        return React.createElement(TouchableOpacity, { onPress, accessibilityRole: 'button' }, children);
      }
      return React.createElement(View, null, children);
    },
    Rect: function RectMock({ onPress, children }: { onPress?: () => void; children?: React.ReactNode }) {
      if (onPress) {
        return React.createElement(TouchableOpacity, { onPress, accessibilityRole: 'button' }, children);
      }
      return React.createElement(View, null, children);
    },
    Line: function LineMock() {
      return null;
    },
    Text: function TextMock({ children }: { children?: React.ReactNode }) {
      return React.createElement(Text, null, children);
    },
  };
});

beforeEach(() => {
  useTransactionStore.setState({
    allTransactions: [],
    transactions: [],
    selectedMonth: 6,
    selectedYear: 2026,
    periodStart: null,
    periodEnd: null,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    isLoading: false,
    error: null,
  });
});

describe('MonthlyChart', () => {
  it('renders title and info icon when onInfoPress is provided', () => {
    render(<MonthlyChart onInfoPress={jest.fn()} />);
    expect(screen.getByText('Monthly Net')).toBeTruthy();
    expect(screen.getByTestId('monthly-chart-info-btn')).toBeTruthy();
  });

  it('shows empty state when no transactions exist in the year', () => {
    render(<MonthlyChart />);
    expect(screen.getByText('No transactions in 2026')).toBeTruthy();
  });

  it('renders 5 month labels matching the selected month window', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date('2026-01-15') }),
        mockTransaction({ id: '2', amount: 50000, type: 'expense', date: new Date('2026-06-15') }),
      ],
    });
    render(<MonthlyChart />);
    const monthLabels = screen.getAllByText(/^[A-Z]$/);
    expect(monthLabels.length).toBe(5);
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getAllByText('J').length).toBe(2);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.queryByText('F')).toBeNull();
  });

  it('renders y-axis tick labels', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 150000, type: 'income', date: new Date('2026-06-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('20k')).toBeTruthy();
    expect(screen.getByText('100k')).toBeTruthy();
    expect(screen.getByText('160k')).toBeTruthy();
  });

  it('shows amount label above an active bar when tapped', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 120000, type: 'income', date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.queryByText(formatCurrency(120000))).toBeNull();
    const bars = screen.getAllByRole('button');
    expect(bars.length).toBe(5);
    fireEvent.press(bars[0]);
    expect(screen.getByText(formatCurrency(120000))).toBeTruthy();
  });

  it('calls onMonthSelect when a bar is tapped', () => {
    const onSelect = jest.fn();
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart onMonthSelect={onSelect} />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[0]);
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('tapping the same bar toggles the active state', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[0]);
    expect(screen.getByText(formatCurrency(50000))).toBeTruthy();
    fireEvent.press(bars[0]);
    expect(screen.queryByText(formatCurrency(50000))).toBeNull();
  });

  it('shows correct amount for expense (negative net)', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 80000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[0]);
    expect(screen.getByText(formatCurrency(80000))).toBeTruthy();
  });

  it('calls onInfoPress when info icon is pressed', () => {
    const onInfo = jest.fn();
    render(<MonthlyChart onInfoPress={onInfo} />);
    fireEvent.press(screen.getByTestId('monthly-chart-info-btn'));
    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  it('does not call onMonthSelect when toggling the same bar off', () => {
    const onSelect = jest.fn();
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart onMonthSelect={onSelect} />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[0]);
    expect(onSelect).toHaveBeenCalledWith(4);
    expect(onSelect).toHaveBeenCalledTimes(1);
    onSelect.mockClear();
    fireEvent.press(bars[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('syncs active bar when selectedMonth changes from store', async () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, type: 'income', date: new Date('2026-05-15') }),
        mockTransaction({ id: '2', amount: 100000, type: 'income', date: new Date('2026-07-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.getByText(formatCurrency(100000))).toBeTruthy();
    useTransactionStore.setState({ selectedMonth: 4 });
    await waitFor(() => {
      expect(screen.getByText(formatCurrency(50000))).toBeTruthy();
    });
  });
});
