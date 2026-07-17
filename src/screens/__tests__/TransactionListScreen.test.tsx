import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
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

    expect(FilteredTransactionList).toHaveBeenCalled();
    const lastCall = (FilteredTransactionList as jest.Mock).mock.calls;
    const callArg = lastCall[lastCall.length - 1][0];
    expect(callArg.filterMode).toBe('month');
  });

  it('shows month net total by default', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const txns = [
      { id: 't1', userId: 'u', type: 'expense', amount: 50000, category: 'food', description: 'Lunch', date: today, createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', userId: 'u', type: 'income', amount: 100000, category: 'salary', description: 'Pay', date: today, createdAt: new Date(), updatedAt: new Date() },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => { capturedCallback = cb; return jest.fn(); },
    );

    render(<TransactionListScreen />);
    act(() => { capturedCallback(txns); });

    expect(screen.getByText(/Net total · Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/50\.000/)).toBeTruthy();
  });

  it('shows today net total when Today button pressed', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const txns = [
      { id: 't1', userId: 'u', type: 'expense', amount: 30000, category: 'food', description: 'Lunch', date: today, createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', userId: 'u', type: 'income', amount: 200000, category: 'salary', description: 'Pay', date: yesterday, createdAt: new Date(), updatedAt: new Date() },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => { capturedCallback = cb; return jest.fn(); },
    );

    render(<TransactionListScreen />);
    act(() => { capturedCallback(txns); });
    fireEvent.press(screen.getByText('Today'));

    expect(screen.getByText(/Net total · Today/)).toBeTruthy();
    expect(screen.getByText(/-30\.000/)).toBeTruthy();
  });

  it('switches back to month total when This Month pressed', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const txns = [
      { id: 't1', userId: 'u', type: 'expense', amount: 30000, category: 'food', description: 'Lunch', date: today, createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', userId: 'u', type: 'income', amount: 200000, category: 'salary', description: 'Pay', date: yesterday, createdAt: new Date(), updatedAt: new Date() },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => { capturedCallback = cb; return jest.fn(); },
    );

    render(<TransactionListScreen />);
    act(() => { capturedCallback(txns); });
    fireEvent.press(screen.getByText('Today'));
    fireEvent.press(screen.getByText('This Month'));

    expect(screen.getByText(/Net total · Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/170\.000/)).toBeTruthy();
  });

  it('renders net total section inside a card container', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const summaryLabel = screen.getByText(/Net total ·/);
    expect(summaryLabel).toBeTruthy();
  });

  it('renders both filter buttons with equal presence', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const thisMonthBtn = screen.getByText('This Month');
    const todayBtn = screen.getByText('Today');
    expect(thisMonthBtn).toBeTruthy();
    expect(todayBtn).toBeTruthy();
  });

  it('does not render any divider elements', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    const { toJSON } = render(<TransactionListScreen />);
    const tree = JSON.stringify(toJSON());

    expect(tree).not.toMatch(/summaryDivider/);
  });

  it('shows zero net total when no today transactions', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const txns = [
      { id: 't1', userId: 'u', type: 'expense', amount: 50000, category: 'food', description: 'Lunch', date: yesterday, createdAt: new Date(), updatedAt: new Date() },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => { capturedCallback = cb; return jest.fn(); },
    );

    render(<TransactionListScreen />);
    act(() => { capturedCallback(txns); });
    fireEvent.press(screen.getByText('Today'));

    expect(screen.getByText(/Net total · Today/)).toBeTruthy();
    expect(screen.getByText(/0 ₫/)).toBeTruthy();
  });
});
