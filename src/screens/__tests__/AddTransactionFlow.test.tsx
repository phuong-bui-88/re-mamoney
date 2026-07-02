import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TransactionListScreen from '@screens/TransactionListScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';
import { getMonthStart, getMonthEnd } from '@utils/currency';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    getParent: () => ({ navigate: jest.fn() }),
  }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('@components/index', () => ({
  PeriodFilter: jest.fn(() => null),
  SegmentedControl: jest.fn(() => null),
  FilteredTransactionList: jest.requireActual('../../components/FilteredTransactionList').default,
  FloatingActionButton: jest.fn(() => null),
}));

beforeEach(() => {
  jest.clearAllMocks();

  useAuthStore.setState({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    isLoading: false,
    error: null,
  });

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

describe('AddTransactionFlow', () => {
  it('creates an expense transaction and displays it in the transaction list', async () => {
    const newTransaction = {
      id: 'tx-1',
      userId: 'test-user',
      type: 'expense' as const,
      amount: 50000,
      category: 'food',
      description: 'Lunch',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (firebaseService.addTransaction as jest.Mock).mockResolvedValue(newTransaction);
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    const now = new Date();
    useTransactionStore.getState().setPeriod(getMonthStart(now), getMonthEnd(now));

    await useTransactionStore.getState().addTransaction({
      userId: 'test-user',
      type: 'expense',
      amount: 50000,
      category: 'food',
      description: 'Lunch',
      date: new Date(),
    });

    const storeState = useTransactionStore.getState();
    expect(firebaseService.addTransaction).toHaveBeenCalledTimes(1);
    expect(storeState.allTransactions).toHaveLength(1);
    expect(storeState.allTransactions[0].description).toBe('Lunch');

    render(<TransactionListScreen />);

    expect(screen.getByText('food')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
  });
});
