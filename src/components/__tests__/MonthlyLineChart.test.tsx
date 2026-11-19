import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MonthlyLineChart, { formatTick, niceStep } from '@components/MonthlyLineChart';
import { useTransactionStore } from '@store/index';
import { formatCurrency } from '@utils/currency';
import type { Transaction } from '@/types';

jest.mock('react-native-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View, Text } = require('react-native');
  const passthrough = ({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
    React.createElement(View, { testID }, children);
  return {
    __esModule: true,
    default: passthrough,
    G: passthrough,
    Line: () => null,
    Circle: (props: Record<string, unknown>) =>
      React.createElement(View, { testID: 'line-point', ...props }),
    Path: (props: Record<string, unknown>) => React.createElement(View, props),
    Text: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(Text, null, children),
  };
});

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx',
  userId: 'u',
  type: 'income',
  amount: 100000,
  category: 'salary',
  description: '',
  date: new Date(2026, 0, 15),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const seed = (allTransactions: Transaction[], selectedMonth = 6): void => {
  useTransactionStore.setState({
    allTransactions,
    transactions: [],
    selectedMonth,
    selectedYear: 2026,
  });
};

beforeEach(() => seed([]));

describe('MonthlyLineChart', () => {
  it('shows the empty state when the year has no transactions', () => {
    render(<MonthlyLineChart />);
    expect(screen.getByText('No transactions in 2026')).toBeTruthy();
    expect(screen.queryByTestId('monthly-line-path')).toBeNull();
  });

  it('renders the title and info button', () => {
    const onInfoPress = jest.fn();
    render(<MonthlyLineChart onInfoPress={onInfoPress} />);
    expect(screen.getByText('Monthly Net')).toBeTruthy();
    fireEvent.press(screen.getByTestId('monthly-chart-info-btn'));
    expect(onInfoPress).toHaveBeenCalled();
  });

  it('draws one point and label for each of the 12 months', () => {
    seed([tx({ amount: 500000, date: new Date(2026, 2, 10) })]);
    render(<MonthlyLineChart />);
    expect(screen.getAllByTestId('line-point')).toHaveLength(12);
    for (let m = 1; m <= 12; m++) expect(screen.getByText(String(m))).toBeTruthy();
  });

  it('starts the line hidden so it can draw in', () => {
    seed([tx({ amount: 500000, date: new Date(2026, 2, 10) })]);
    render(<MonthlyLineChart />);
    const line = screen.getByTestId('monthly-line-path');
    expect(line.props.d).toMatch(/^M/);
    expect(line.props.strokeDasharray).toBeGreaterThan(0);
    expect(line.props.animatedProps.strokeDashoffset).toBeCloseTo(line.props.strokeDasharray);
  });

  it('shows the net value of the selected month', () => {
    seed(
      [
        tx({ id: '1', amount: 800000, date: new Date(2026, 6, 3) }),
        tx({ id: '2', type: 'expense', amount: 300000, date: new Date(2026, 6, 20) }),
      ],
      6
    );
    render(<MonthlyLineChart />);
    expect(screen.getByText(formatCurrency(500000))).toBeTruthy();
  });

  it('calls onMonthSelect when a month is tapped', () => {
    seed([tx({ amount: 500000, date: new Date(2026, 2, 10) })]);
    const onMonthSelect = jest.fn();
    render(<MonthlyLineChart onMonthSelect={onMonthSelect} />);
    fireEvent.press(screen.getByTestId('line-month-2'));
    expect(onMonthSelect).toHaveBeenCalledWith(2);
  });

  it('formats negative ticks and picks round steps', () => {
    expect(formatTick(0)).toBe('0');
    expect(formatTick(200000)).toBe('200k');
    expect(formatTick(-1500000)).toBe('-1.5M');
    expect(niceStep(1000000)).toBe(200000);
  });
});
