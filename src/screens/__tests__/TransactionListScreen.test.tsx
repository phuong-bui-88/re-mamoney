import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import TransactionListScreen from '@screens/TransactionListScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';

jest.mock('@react-navigation/native', () => {
  const mockNavigate = jest.fn();
  return {
    useNavigation: () => ({
      getParent: () => ({ navigate: mockNavigate }),
    }),
    useRoute: () => ({ params: {} }),
    __mockNavigate: mockNavigate,
  };
});

jest.mock('@components/index', () => ({
  MonthCalendar: jest.fn(() => null),
  FilteredTransactionList: jest.fn(() => null),
  FloatingActionButton: jest.fn(() => null),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 6, 15, 12, 0, 0));

  useAuthStore.setState({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    selectedUser: {
      id: 'test-user',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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

afterEach(() => {
  jest.useRealTimers();
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
      expect.any(Function)
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
      user: {
        id: 'user-42',
        email: 'bob@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      selectedUser: {
        id: 'user-42',
        email: 'bob@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).toHaveBeenCalledWith(
      { userId: 'user-42' },
      expect.any(Function)
    );
  });

  it('does not subscribe when selectedUser is null', () => {
    useAuthStore.setState({ selectedUser: null });

    render(<TransactionListScreen />);

    expect(firebaseService.subscribeToTransactions).not.toHaveBeenCalled();
  });

  it('passes transactions from Firebase callback to the store', () => {
    const mockTransactions = [
      {
        id: 'fb-1',
        userId: 'test-user',
        type: 'expense',
        amount: 30000,
        category: 'food',
        description: 'Coffee',
        date: new Date('2026-07-10'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let capturedCallback: (txs: unknown[]) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, callback: (txs: unknown[]) => void) => {
        capturedCallback = callback;
        return jest.fn();
      }
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
      selectedUser: {
        id: 'user-99',
        email: 'new@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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

  it('passes onTransactionPress to FilteredTransactionList', () => {
    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const lastCall = (FilteredTransactionList as jest.Mock).mock.calls;
    const callArg = lastCall[lastCall.length - 1][0];
    expect(typeof callArg.onTransactionPress).toBe('function');
  });

  it('navigates to EditTransaction when onTransactionPress is called', () => {
    const { __mockNavigate: mockNavigate } = require('@react-navigation/native');

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const lastCall = (FilteredTransactionList as jest.Mock).mock.calls;
    const callArg = lastCall[lastCall.length - 1][0];
    const mockTransaction = { id: 'tx-99', type: 'expense', amount: 30000 };

    callArg.onTransactionPress(mockTransaction);

    expect(mockNavigate).toHaveBeenCalledWith('EditTransaction', { transactionId: 'tx-99' });
  });

  it('shows month net total by default', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const txns = [
      {
        id: 't1',
        userId: 'u',
        type: 'expense',
        amount: 50000,
        category: 'food',
        description: 'Lunch',
        date: today,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        userId: 'u',
        type: 'income',
        amount: 100000,
        category: 'salary',
        description: 'Pay',
        date: today,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });

    expect(screen.getByText(/Net total · Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/50\.000/)).toBeTruthy();
  });

  it('renders net total with exactly one currency symbol', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const amountText = screen.getByText(/₫/);
    const joined = Array.isArray(amountText.props.children)
      ? amountText.props.children.join('')
      : String(amountText.props.children);

    expect(joined.match(/₫/g)).toHaveLength(1);
  });

  it('shows search net total when a query is typed', () => {
    const txns = [
      {
        id: 't1',
        userId: 'u',
        type: 'expense',
        amount: 30000,
        category: 'food',
        description: 'Bánh tráng cuốn',
        date: new Date(2026, 6, 10, 12),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        userId: 'u',
        type: 'expense',
        amount: 20000,
        category: 'food',
        description: 'Coffee',
        date: new Date(2026, 6, 15, 8),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');

    expect(screen.getByText(/Net total · "banh trang cuon":/)).toBeTruthy();
    expect(screen.getByText(/-30\.000/)).toBeTruthy();
  });

  it('restores month total when search is cleared', () => {
    const txns = [
      {
        id: 't1',
        userId: 'u',
        type: 'expense',
        amount: 30000,
        category: 'food',
        description: 'Bánh tráng cuốn',
        date: new Date(2026, 6, 10, 12),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        userId: 'u',
        type: 'income',
        amount: 200000,
        category: 'salary',
        description: 'Pay',
        date: new Date(2026, 6, 15, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');
    fireEvent.press(screen.getByTestId('search-clear'));

    expect(screen.getByText(/Net total · Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/170\.000/)).toBeTruthy();
  });

  it('renders net total section inside a card container', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const summaryLabel = screen.getByText(/Net total ·/);
    expect(summaryLabel).toBeTruthy();
  });

  it('renders search bar with placeholder and no filter buttons', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const input = screen.getByTestId('search-input');
    expect(input.props.placeholder).toBe('Search e.g. banh trang cuon');
    expect(screen.queryByText('This Month')).toBeNull();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('does not render any divider elements', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    const { toJSON } = render(<TransactionListScreen />);
    const tree = JSON.stringify(toJSON());

    expect(tree).not.toMatch(/summaryDivider/);
  });

  it('shows zero net total when nothing matches the query', () => {
    const txns = [
      {
        id: 't1',
        userId: 'u',
        type: 'expense',
        amount: 50000,
        category: 'food',
        description: 'Coffee',
        date: new Date(2026, 6, 15, 8),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');

    expect(screen.getByText(/Net total · "banh trang cuon":/)).toBeTruthy();
    expect(screen.getByText(/0 ₫/)).toBeTruthy();
  });

  it('passes month, year and day-press handler to MonthCalendar', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    const lastCall = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(lastCall.month).toBe(6);
    expect(lastCall.year).toBe(2026);
    expect(lastCall.selectedDay).toBeNull();
    expect(typeof lastCall.onDayPress).toBe('function');
  });

  it('filters list and net total to the tapped calendar day', () => {
    const txns = [
      {
        id: 't1',
        userId: 'u',
        type: 'expense',
        amount: 30000,
        category: 'food',
        description: 'Lunch',
        date: new Date(2026, 6, 10, 12),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        userId: 'u',
        type: 'income',
        amount: 100000,
        category: 'salary',
        description: 'Pay',
        date: new Date(2026, 6, 20, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    const calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.selectedDate).toEqual(new Date(2026, 6, 10));
    expect(screen.getByText(/Net total · 10\/07\/2026/)).toBeTruthy();
    expect(screen.getByText(/-30\.000/)).toBeTruthy();
  });

  it('deselects the day when tapping the active day again', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(10);

    // The real calendar converts a re-tap of the active day into onDayPress(null)
    act(() => {
      calProps.onDayPress(null);
    });
    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBeNull();

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.selectedDate).toBeNull();
  });

  it('keeps the day selected while typing a search query', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh');

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(10);

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.searchQuery).toBe('banh');
    expect(listProps.selectedDate).toEqual(new Date(2026, 6, 10));
    expect(listProps.filterMode).toBe('day');
  });

  it('passes searchQuery to FilteredTransactionList while typing', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.searchQuery).toBe('banh trang cuon');
  });

  it('keeps the search text when tapping a calendar day', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(10);

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.searchQuery).toBe('banh trang cuon');
    expect(listProps.selectedDate).toEqual(new Date(2026, 6, 10));
  });

  it('filters net total to matching transactions inside the selected day', () => {
    const txns = [
      {
        id: 'c1',
        userId: 'u',
        type: 'expense',
        amount: 15000,
        category: 'food',
        description: 'Chè mè đen',
        date: new Date(2026, 6, 10, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'k1',
        userId: 'u',
        type: 'expense',
        amount: 16000,
        category: 'food',
        description: 'Kẹo',
        date: new Date(2026, 6, 10, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c2',
        userId: 'u',
        type: 'expense',
        amount: 12000,
        category: 'food',
        description: 'Chè chuối',
        date: new Date(2026, 6, 20, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    let capturedCallback: (txs: typeof txns) => void = () => {};
    (firebaseService.subscribeToTransactions as jest.Mock).mockImplementation(
      (_filter: unknown, cb: (txs: typeof txns) => void) => {
        capturedCallback = cb;
        return jest.fn();
      }
    );

    render(<TransactionListScreen />);
    act(() => {
      capturedCallback(txns);
    });

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    const calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'che');

    expect(screen.getByText(/Net total · 10\/07\/2026 · "che":/)).toBeTruthy();
    expect(screen.getByText(/-15\.000/)).toBeTruthy();
    expect(screen.queryByText(/-31\.000/)).toBeNull();
    expect(screen.queryByText(/-27\.000/)).toBeNull();
  });

  it('returns to the full day view when search is cleared', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh');
    fireEvent.press(screen.getByTestId('search-clear'));

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(10);

    expect(screen.getByText(/Net total · 10\/07\/2026:/)).toBeTruthy();

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.searchQuery).toBe('');
    expect(listProps.selectedDate).toEqual(new Date(2026, 6, 10));
  });

  it('clears the search box and day selection when month changed via calendar picker', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'banh trang cuon');

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onMonthChange(7);
    });

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.month).toBe(7);
    expect(calProps.selectedDay).toBeNull();

    const FilteredTransactionList = jest.requireMock('@components/index').FilteredTransactionList;
    const listProps =
      FilteredTransactionList.mock.calls[FilteredTransactionList.mock.calls.length - 1][0];
    expect(listProps.searchQuery).toBe('');
  });
});
