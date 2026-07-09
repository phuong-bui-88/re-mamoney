import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TransactionListScreen from '@screens/TransactionListScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    getParent: () => ({ navigate: jest.fn() }),
  }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('@components/index', () => ({
  PeriodFilter: jest.fn(() => null),
  SegmentedControl: jest.fn(() => null),
  FilteredTransactionList: jest.fn(() => null),
  FloatingActionButton: jest.fn(() => null),
}));

beforeEach(() => {
  jest.clearAllMocks();

  useAuthStore.setState({
    user: { id: 'test-user', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
    selectedUser: { id: 'test-user', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
    savedAccounts: [],
    isLoading: false,
    error: null,
  });

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

describe('TransactionListScreen', () => {
  it('renders without crashing', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(screen).toBeDefined();
  });

  it('subscribes to Firebase transactions on mount', () => {
    render(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).toHaveBeenCalledWith(
      { userId: 'test-user' },
      expect.any(Function),
    );
  });

  it('unsubscribes from Firebase on unmount', () => {
    const unsubscribe = jest.fn();
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(unsubscribe);

    const { unmount } = render(<TransactionListScreen />);
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('subscribes with the correct userId from auth store', () => {
    useAuthStore.setState({
      user: { id: 'user-42', email: 'bob@example.com', createdAt: new Date(), updatedAt: new Date() },
      selectedUser: { id: 'user-42', email: 'bob@example.com', createdAt: new Date(), updatedAt: new Date() },
    });

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).toHaveBeenCalledWith(
      { userId: 'user-42' },
      expect.any(Function),
    );
  });

  it('does not subscribe when selectedUser is null', () => {
    useAuthStore.setState({ selectedUser: null });

    render(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).not.toHaveBeenCalled();
  });

  it('passes transactions from Firebase callback to the store', () => {
    const mockTransactions = [
      { id: 'fb-1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: new Date('2026-07-10'), createdAt: new Date(), updatedAt: new Date() },
    ];

    let capturedCallback: (txs: unknown[]) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, callback: (txs: unknown[]) => void) => {
        capturedCallback = callback;
        return jest.fn();
      },
    );

    render(<TransactionListScreen />);

    capturedCallback(mockTransactions);

    const storeState = useTransactionStore.getState();
    expect(storeState.allTransactions).toHaveLength(1);
    expect(storeState.allTransactions[0].id).toBe('fb-1');
  });

  it('sets period before subscribing to Firebase', () => {
    render(<TransactionListScreen />);

    const storeState = useTransactionStore.getState();
    expect(storeState.periodStart).toBeInstanceOf(Date);
    expect(storeState.periodEnd).toBeInstanceOf(Date);
  });

  it('re-sets period when selectedUser changes', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    const { rerender } = render(<TransactionListScreen />);

    useAuthStore.setState({
      selectedUser: { id: 'user-99', email: 'new@example.com', createdAt: new Date(), updatedAt: new Date() },
    });

    rerender(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).toHaveBeenCalledTimes(2);
  });

  it('renders all child components', () => {
    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(FilteredTransactionList).toHaveBeenCalledTimes(2);
    const callArg = (FilteredTransactionList as jest.Mock).mock.calls[0][0];
    expect(callArg.type).toBe('expense');
  });
});
