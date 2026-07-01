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
  it('shows empty text when no expense transactions exist', () => {
    useTransactionStore.setState({
      transactions: [mockTransaction({ type: 'income' })],
    });

    render(<FilteredTransactionList type="expense" />);

    expect(screen.getByText('No expense transactions yet')).toBeTruthy();
  });

  it('shows empty text when no income transactions exist', () => {
    useTransactionStore.setState({
      transactions: [mockTransaction({ type: 'expense' })],
    });

    render(<FilteredTransactionList type="income" />);

    expect(screen.getByText('No income transactions yet')).toBeTruthy();
  });

  it('renders transaction rows for matching type', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', description: 'Coffee' }),
        mockTransaction({ id: '2', type: 'expense', description: 'Lunch' }),
      ],
    });

    render(<FilteredTransactionList type="expense" />);

    expect(screen.getByText('Coffee')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('filters by type: only shows expenses when type is expense', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', description: 'Groceries' }),
        mockTransaction({ id: '2', type: 'income', description: 'Salary' }),
      ],
    });

    render(<FilteredTransactionList type="expense" />);

    expect(screen.getByText('Groceries')).toBeTruthy();
    expect(screen.queryByText('Salary')).toBeNull();
  });

  it('filters by type: only shows income when type is income', () => {
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: '1', type: 'expense', description: 'Groceries' }),
        mockTransaction({ id: '2', type: 'income', description: 'Salary' }),
      ],
    });

    render(<FilteredTransactionList type="income" />);

    expect(screen.getByText('Salary')).toBeTruthy();
    expect(screen.queryByText('Groceries')).toBeNull();
  });

  it('shows empty text when store has no transactions at all', () => {
    useTransactionStore.setState({ transactions: [] });

    render(<FilteredTransactionList type="expense" />);

    expect(screen.getByText('No expense transactions yet')).toBeTruthy();
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

    render(<FilteredTransactionList type="expense" />);

    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Item ${i + 1}`)).toBeTruthy();
    }
  });
});
