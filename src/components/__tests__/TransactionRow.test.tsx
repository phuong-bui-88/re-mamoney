import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TransactionRow from '@components/TransactionRow';
import type { Transaction } from '@/types';

jest.mock('react-native-gesture-handler/Swipeable', () => {
  const MockSwipeable = ({ children }: { children: React.ReactNode }) => children;
  return MockSwipeable;
});

const baseTransaction: Transaction = {
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense',
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date('2026-07-15T10:00:00'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TransactionRow', () => {
  it('renders category text', () => {
    render(<TransactionRow transaction={baseTransaction} />);
    expect(screen.getByText('food')).toBeTruthy();
  });

  it('renders description text', () => {
    render(<TransactionRow transaction={baseTransaction} />);
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('renders formatted amount with minus sign for expense', () => {
    render(<TransactionRow transaction={baseTransaction} />);
    expect(screen.getByText(/-50.000/)).toBeTruthy();
  });

  it('renders formatted amount with plus sign for income', () => {
    render(
      <TransactionRow
        transaction={{ ...baseTransaction, type: 'income', amount: 200000 }}
      />,
    );
    expect(screen.getByText(/\+200.000/)).toBeTruthy();
  });

  it('renders formatted date', () => {
    render(<TransactionRow transaction={baseTransaction} />);
    expect(screen.getByText('15/07/2026')).toBeTruthy();
  });

  it('renders without onDelete callback', () => {
    render(<TransactionRow transaction={baseTransaction} />);
    expect(screen.getByText('Lunch')).toBeTruthy();
  });

  it('renders with onDelete callback (Swipeable wrapper)', () => {
    const onDelete = jest.fn();
    render(<TransactionRow transaction={baseTransaction} onDelete={onDelete} />);
    expect(screen.getByText('Lunch')).toBeTruthy();
  });
});
