import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CategoryChart from '@components/CategoryChart';
import { useTransactionStore } from '@store/index';
import { CATEGORY_LABELS } from '@utils/categories';
import { formatCurrency } from '@utils/currency';

jest.mock('../FilteredTransactionList', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View, Text } = require('react-native');
  return function MockFilteredTransactionList({
    type,
    category,
  }: {
    type: string;
    category?: string;
  }) {
    return React.createElement(
      View,
      { testID: 'FilteredTransactionList' },
      React.createElement(Text, null, `type: ${type}, category: ${category}`),
    );
  };
});

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: function SvgMock({ children }: { children?: React.ReactNode }) {
    return children || null;
  },
  Svg: function SvgMock({ children }: { children?: React.ReactNode }) {
    return children || null;
  },
  Path: function PathMock() {
    return null;
  },
  G: function GMock({ children }: { children?: React.ReactNode }) {
    return children || null;
  },
  Circle: function CircleMock() {
    return null;
  },
  Text: function TextMock({ children }: { children?: React.ReactNode }) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Text } = require('react-native');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');
    return React.createElement(Text, null, children);
  },
}));

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

beforeEach(() => {
  useTransactionStore.setState({
    allTransactions: [],
    transactions: [],
    periodStart: null,
    periodEnd: null,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    isLoading: false,
    error: null,
  });
});

describe('CategoryChart', () => {
  it('shows empty text when no transactions exist (default Expense tab)', () => {
    render(<CategoryChart />);
    expect(screen.getByText('No expenses this period')).toBeTruthy();
  });

  it('shows empty text for income when no income transactions exist', () => {
    useTransactionStore.setState({
      transactions: [mockTransaction({ type: 'expense' })],
    });

    render(<CategoryChart />);

    fireEvent.press(screen.getByText('Income'));
    expect(screen.getByText('No incomes this period')).toBeTruthy();
  });

  it('renders category breakdown with grouped amounts', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', category: 'food', amount: 50000 }),
        mockTransaction({ id: '2', category: 'transport', amount: 30000 }),
        mockTransaction({ id: '3', category: 'food', amount: 20000 }),
      ],
    });

    render(<CategoryChart />);

    expect(screen.getByText(CATEGORY_LABELS.food)).toBeTruthy();
    expect(screen.getByText(CATEGORY_LABELS.transport)).toBeTruthy();
    expect(screen.getByText('70.000 ₫')).toBeTruthy();
    expect(screen.getByText('30.000 ₫')).toBeTruthy();
  });

  it('shows total in the donut center by default', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', category: 'food', amount: 50000 }),
        mockTransaction({ id: '2', category: 'transport', amount: 30000 }),
      ],
    });

    render(<CategoryChart />);

    expect(screen.getByText('80.000 ₫')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('renders income categories on Income tab', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'income', category: 'salary', amount: 1000000 }),
        mockTransaction({ id: '2', type: 'income', category: 'freelance', amount: 500000 }),
      ],
    });

    render(<CategoryChart />);
    fireEvent.press(screen.getByText('Income'));

    expect(screen.getByText(CATEGORY_LABELS.salary)).toBeTruthy();
    expect(screen.getByText(CATEGORY_LABELS.freelance)).toBeTruthy();
  });

  it('switches between Expense and Income on toggle', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', category: 'food', amount: 50000 }),
        mockTransaction({ id: '2', type: 'income', category: 'salary', amount: 1000000 }),
      ],
    });

    render(<CategoryChart />);

    expect(screen.getByText(CATEGORY_LABELS.food)).toBeTruthy();
    expect(screen.queryByText(CATEGORY_LABELS.salary)).toBeNull();

    fireEvent.press(screen.getByText('Income'));

    expect(screen.getByText(CATEGORY_LABELS.salary)).toBeTruthy();
    expect(screen.queryByText(CATEGORY_LABELS.food)).toBeNull();
  });

  it('shows correct total for expense tab', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', category: 'food', amount: 50000 }),
        mockTransaction({ id: '2', category: 'transport', amount: 30000 }),
      ],
    });

    render(<CategoryChart />);

    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('80.000 ₫')).toBeTruthy();
  });

  it('renders category icons in the legend', () => {
    useTransactionStore.setState({
      transactions: [mockTransaction({ category: 'food', amount: 50000 })],
    });

    render(<CategoryChart />);

    const icons = screen.getAllByText('restaurant-outline');
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it('sorts categories descending by amount', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', category: 'transport', amount: 30000 }),
        mockTransaction({ id: '2', category: 'food', amount: 50000 }),
      ],
    });

    render(<CategoryChart />);

    const legendItems = screen.getAllByText(/.*/);
    const foodIdx = legendItems.findIndex((el) => el.props.children === CATEGORY_LABELS.food);
    const transportIdx = legendItems.findIndex((el) => el.props.children === CATEGORY_LABELS.transport);
    expect(foodIdx).toBeLessThan(transportIdx);
  });

  it('uses raw category key as label for unknown categories', () => {
    useTransactionStore.setState({
      transactions: [mockTransaction({ category: 'gifts', amount: 10000 })],
    });

    render(<CategoryChart />);

    expect(screen.getByText('gifts')).toBeTruthy();
  });

  describe('drill-down behavior', () => {
    it('shows transaction list when a legend row is pressed', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
          mockTransaction({ id: '2', category: 'transport', amount: 30000 }),
        ],
      });
      render(<CategoryChart />);

      expect(screen.getByText(CATEGORY_LABELS.transport)).toBeTruthy();

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));

      expect(screen.getByTestId('FilteredTransactionList')).toBeTruthy();
      expect(screen.queryByText(CATEGORY_LABELS.transport)).toBeNull();
    });

    it('shows category header with label and total when selected', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
          mockTransaction({ id: '2', category: 'food', amount: 20000 }),
        ],
      });
      render(<CategoryChart />);

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));

      expect(screen.getAllByText(CATEGORY_LABELS.food).length).toBe(2);
      expect(screen.getByText(`Total: ${formatCurrency(70000)}`)).toBeTruthy();
    });

    it('returns to legend view when back button is pressed', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
          mockTransaction({ id: '2', category: 'transport', amount: 30000 }),
        ],
      });
      render(<CategoryChart />);

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));
      expect(screen.getByTestId('FilteredTransactionList')).toBeTruthy();

      fireEvent.press(screen.getByTestId('chart-back'));

      expect(screen.getByText(CATEGORY_LABELS.transport)).toBeTruthy();
      expect(screen.queryByTestId('FilteredTransactionList')).toBeNull();
    });

    it('clears selection when segmented control tab changes', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
          mockTransaction({ id: '2', type: 'income', category: 'salary', amount: 1000000 }),
        ],
      });
      render(<CategoryChart />);

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));
      expect(screen.getByTestId('FilteredTransactionList')).toBeTruthy();

      fireEvent.press(screen.getByText('Income'));

      expect(screen.getByText(CATEGORY_LABELS.salary)).toBeTruthy();
      expect(screen.queryByTestId('FilteredTransactionList')).toBeNull();
    });

    it('passes correct type and category to FilteredTransactionList', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
        ],
      });
      render(<CategoryChart />);

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));

      expect(screen.getByText('type: expense, category: food')).toBeTruthy();
    });

    it('shows arrow-back icon when a category is selected', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', amount: 50000 }),
        ],
      });
      render(<CategoryChart />);

      expect(screen.queryByText('arrow-back')).toBeNull();

      fireEvent.press(screen.getByText(CATEGORY_LABELS.food));

      expect(screen.getByText('arrow-back')).toBeTruthy();
    });
  });
});
