import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FilteredTransactionList from '@components/FilteredTransactionList';
import { useTransactionStore } from '@store/index';

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

describe('FilteredTransactionList', () => {
  it('shows empty text when no transactions exist', () => {
    useTransactionStore.setState({
      transactions: [],
    });

    render(<FilteredTransactionList filterMode="month" />);

    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('renders all transactions (both income and expense) in unified list', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', description: 'Coffee' }),
        mockTransaction({ id: '2', type: 'income', description: 'Salary' }),
      ],
    });

    render(<FilteredTransactionList filterMode="month" />);

    expect(screen.getByText('Coffee')).toBeTruthy();
    expect(screen.getByText('Salary')).toBeTruthy();
  });

  it('filters by category when category prop is provided', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', category: 'food', description: 'Coffee' }),
        mockTransaction({ id: '2', type: 'expense', category: 'transport', description: 'Bus' }),
      ],
    });

    render(<FilteredTransactionList category="food" filterMode="month" />);

    expect(screen.getByText('Coffee')).toBeTruthy();
    expect(screen.queryByText('Bus')).toBeNull();
  });

  it('filters to today only when filterMode is today', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);

    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', description: 'Today expense', date: today }),
        mockTransaction({ id: '2', type: 'expense', description: 'Yesterday expense', date: yesterday }),
      ],
    });

    render(<FilteredTransactionList filterMode="today" />);

    expect(screen.getByText('Today expense')).toBeTruthy();
    expect(screen.queryByText('Yesterday expense')).toBeNull();
  });

  it('shows empty text when store has no transactions at all', () => {
    useTransactionStore.setState({ transactions: [] });

    render(<FilteredTransactionList filterMode="month" />);

    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('renders multiple transaction rows for many items', () => {
    const manyTransactions = Array.from({ length: 5 }, (_, i) =>
      mockTransaction({
        id: `tx-${i}`,
        type: 'expense',
        description: `Item ${i + 1}`,
        amount: (i + 1) * 10000,
      }),
    );
    useTransactionStore.setState({ transactions: manyTransactions });

    render(<FilteredTransactionList filterMode="month" />);

    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Item ${i + 1}`)).toBeTruthy();
    }
  });
});
