import React from 'react';
import { Text } from 'react-native';
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

  it('forwards onTransactionPress to each TransactionRow', () => {
    const onTransactionPress = jest.fn();
    useTransactionStore.setState({
      transactions: [
        mockTransaction({ id: 'tx-1', description: 'Coffee' }),
      ],
    });

    const { UNSAFE_getByType } = render(
      <FilteredTransactionList filterMode="month" onTransactionPress={onTransactionPress} />,
    );

    const row = UNSAFE_getByType(
      require('@components/TransactionRow').default,
    );
    expect(row.props.onPress).toBe(onTransactionPress);
  });

  describe('sorts transactions oldest to newest', () => {
    it('renders transactions in ascending date order', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', description: 'Lunch', date: new Date('2026-07-05T10:00:00') }),
          mockTransaction({ id: '2', description: 'Salary', date: new Date('2026-07-01T10:00:00') }),
          mockTransaction({ id: '3', description: 'Coffee', date: new Date('2026-07-08T10:00:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      const textNodes = screen.UNSAFE_getAllByType(Text);
      const descriptions = textNodes
        .map((node: any) => node.props.children)
        .filter((child: any) => typeof child === 'string' && ['Salary', 'Lunch', 'Coffee'].includes(child));

      expect(descriptions).toEqual(['Salary', 'Lunch', 'Coffee']);
    });

    it('renders a single transaction without error', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', description: 'Only item', date: new Date('2026-07-15T10:00:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);
      expect(screen.getByText('Only item')).toBeTruthy();
    });

    it('applies sort after category filter', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', category: 'food', description: 'Dinner', date: new Date('2026-07-10T10:00:00') }),
          mockTransaction({ id: '2', category: 'food', description: 'Lunch', date: new Date('2026-07-05T10:00:00') }),
          mockTransaction({ id: '3', category: 'transport', description: 'Bus', date: new Date('2026-07-01T10:00:00') }),
        ],
      });

      render(<FilteredTransactionList category="food" filterMode="month" />);

      expect(screen.queryByText('Bus')).toBeNull();

      const textNodes = screen.UNSAFE_getAllByType(Text);
      const descriptions = textNodes
        .map((node: any) => node.props.children)
        .filter((child: any) => typeof child === 'string' && ['Lunch', 'Dinner'].includes(child));

      expect(descriptions).toEqual(['Lunch', 'Dinner']);
    });

    it('applies sort after today filter', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const today1 = new Date(today);
      today1.setHours(12, 0, 0, 0);

      const today2 = new Date(today);
      today2.setHours(8, 0, 0, 0);

      const today3 = new Date(today);
      today3.setHours(18, 0, 0, 0);

      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', description: 'Evening', date: today3 }),
          mockTransaction({ id: '2', description: 'Morning', date: today2 }),
          mockTransaction({ id: '3', description: 'Noon', date: today1 }),
        ],
      });

      render(<FilteredTransactionList filterMode="today" />);

      const textNodes = screen.UNSAFE_getAllByType(Text);
      const descriptions = textNodes
        .map((node: any) => node.props.children)
        .filter((child: any) => typeof child === 'string' && ['Morning', 'Noon', 'Evening'].includes(child));

      expect(descriptions).toEqual(['Morning', 'Noon', 'Evening']);
    });

    it('sorts unsorted input into ascending date order', () => {
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: '1', description: 'Dec', date: new Date('2026-12-25T10:00:00') }),
          mockTransaction({ id: '2', description: 'Jan', date: new Date('2026-01-01T10:00:00') }),
          mockTransaction({ id: '3', description: 'Jun', date: new Date('2026-06-15T10:00:00') }),
          mockTransaction({ id: '4', description: 'Mar', date: new Date('2026-03-10T10:00:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      const textNodes = screen.UNSAFE_getAllByType(Text);
      const descriptions = textNodes
        .map((node: any) => node.props.children)
        .filter((child: any) => typeof child === 'string' && ['Jan', 'Mar', 'Jun', 'Dec'].includes(child));

      expect(descriptions).toEqual(['Jan', 'Mar', 'Jun', 'Dec']);
    });
  });

  describe('grouped multi-input feed', () => {
    it('wraps multiple items from one multi-line input in a single teal group container', () => {
      const userText = 'Hủ tiếu 25k\nCơm 60k\nKẹo 16k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'g1', description: 'Hủ tiếu', amount: 25000, userText, date: new Date('2026-07-15T10:00:00') }),
          mockTransaction({ id: 'g2', description: 'Cơm', amount: 60000, userText, date: new Date('2026-07-15T10:01:00') }),
          mockTransaction({ id: 'g3', description: 'Kẹo', amount: 16000, userText, date: new Date('2026-07-15T10:02:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      const group = screen.getByTestId('group-g1');
      expect(group).toBeTruthy();
      expect(screen.getByText('GROUP')).toBeTruthy();
      expect(screen.getByText(/3 transactions/)).toBeTruthy();
      expect(screen.getByText(/-101\.000/)).toBeTruthy();

      const style = group.props.style;
      const flattened = Array.isArray(style) ? style : [style];
      expect(flattened.some((s: any) => s && s.backgroundColor === '#E0F2F1')).toBe(true);
    });

    it('marks rows inside the group with insideGroup and forwards onPress', () => {
      const onTransactionPress = jest.fn();
      const userText = 'Hủ tiếu 25k\nCơm 60k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'gi1', description: 'Hủ tiếu', amount: 25000, userText, date: new Date('2026-07-15T10:00:00') }),
          mockTransaction({ id: 'gi2', description: 'Cơm', amount: 60000, userText, date: new Date('2026-07-15T10:01:00') }),
          mockTransaction({ id: 'gi3', description: 'Solo', amount: 5000, userText: 'Solo 5k', date: new Date('2026-07-16T10:00:00') }),
        ],
      });

      const { UNSAFE_getAllByType } = render(
        <FilteredTransactionList filterMode="month" onTransactionPress={onTransactionPress} />,
      );

      const TransactionRow = require('@components/TransactionRow').default;
      const rows = UNSAFE_getAllByType(TransactionRow);
      expect(rows).toHaveLength(3);
      const byId = (id: string) => rows.find((r: any) => r.props.transaction.id === id);
      expect(byId('gi1').props.insideGroup).toBe(true);
      expect(byId('gi2').props.insideGroup).toBe(true);
      expect(byId('gi3').props.insideGroup).toBe(false);
      rows.forEach((r: any) => expect(r.props.onPress).toBe(onTransactionPress));
    });

    it('does not group a single-line userText', () => {
      const userText = 'Coffee 30k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'sl1', description: 'Coffee', amount: 30000, userText, date: new Date('2026-07-15T10:00:00') }),
          mockTransaction({ id: 'sl2', description: 'Coffee', amount: 30000, userText, date: new Date('2026-07-15T10:01:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      expect(screen.queryByText('GROUP')).toBeNull();
      expect(screen.queryAllByTestId(/group-/)).toHaveLength(0);
      expect(screen.getAllByText('Coffee')).toHaveLength(2);
    });

    it('does not group a single item with multi-line text', () => {
      const userText = 'Hủ tiếu 25k\nCơm 60k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'one', description: 'Hủ tiếu', amount: 25000, userText, date: new Date('2026-07-15T10:00:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      expect(screen.queryByText('GROUP')).toBeNull();
      expect(screen.queryAllByTestId(/group-/)).toHaveLength(0);
    });

    it('creates two separate groups for two different multi-line inputs', () => {
      const ut1 = 'A 10k\nB 20k';
      const ut2 = 'C 30k\nD 40k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'g2a', description: 'A', amount: 10000, userText: ut1, date: new Date('2026-07-15T10:00:00') }),
          mockTransaction({ id: 'g2b', description: 'B', amount: 20000, userText: ut1, date: new Date('2026-07-15T10:01:00') }),
          mockTransaction({ id: 'g2c', description: 'C', amount: 30000, userText: ut2, date: new Date('2026-07-16T10:00:00') }),
          mockTransaction({ id: 'g2d', description: 'D', amount: 40000, userText: ut2, date: new Date('2026-07-16T10:01:00') }),
        ],
      });

      render(<FilteredTransactionList filterMode="month" />);

      const groups = screen.queryAllByTestId(/group-/);
      expect(groups).toHaveLength(2);
      expect(screen.getAllByText('GROUP')).toHaveLength(2);
    });

    it('groups only items that survive the category filter', () => {
      const userText = 'Hủ tiếu 25k\nCơm 60k';
      useTransactionStore.setState({
        transactions: [
          mockTransaction({ id: 'cf1', description: 'Hủ tiếu', category: 'food', amount: 25000, userText, date: new Date('2026-07-15T10:00:00') }),
          mockTransaction({ id: 'cf2', description: 'Cơm', category: 'transport', amount: 60000, userText, date: new Date('2026-07-15T10:01:00') }),
          mockTransaction({ id: 'cf3', description: 'Kẹo', category: 'food', amount: 16000, userText, date: new Date('2026-07-15T10:02:00') }),
        ],
      });

      render(<FilteredTransactionList category="food" filterMode="month" />);

      expect(screen.queryByText('Cơm')).toBeNull();
      const groups = screen.queryAllByTestId(/group-/);
      expect(groups).toHaveLength(1);
      expect(screen.getByText(/2 transactions/)).toBeTruthy();
    });
  });
});
