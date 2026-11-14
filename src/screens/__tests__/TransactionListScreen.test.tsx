import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import TransactionListScreen from '@screens/TransactionListScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';

let focusCallback: (() => void) | null = null;

jest.mock('@react-navigation/native', () => {
  const mockNavigate = jest.fn();
  return {
    useNavigation: () => ({
      getParent: () => ({ navigate: mockNavigate }),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: () => void) => {
      focusCallback = cb;
    },
    __mockNavigate: mockNavigate,
    __triggerFocus: () => {
      if (focusCallback) focusCallback();
    },
    __resetFocusCallback: () => {
      focusCallback = null;
    },
  };
});

jest.mock('@components/index', () => ({
  MonthCalendar: jest.fn(() => null),
  FilteredTransactionList: jest.fn(() => null),
  FloatingActionButton: jest.fn(() => null),
  ScrollToTopButton: jest.fn(() => null),
  DayTransactionsModal: jest.fn(() => null),
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

  it('does not register a keyboardDidShow listener for auto-scrolling', () => {
    const Keyboard = require('react-native').Keyboard;
    const addListenerSpy = jest.spyOn(Keyboard, 'addListener');

    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const keyboardDidShowCalls = addListenerSpy.mock.calls.filter(
      (call: unknown[]) => call[0] === 'keyboardDidShow'
    );
    expect(keyboardDidShowCalls).toHaveLength(0);

    addListenerSpy.mockRestore();
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

  it('renders calendar and day popup, without floating add / scroll-to-top buttons', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const mocks = jest.requireMock('@components/index');
    expect(mocks.MonthCalendar).toHaveBeenCalled();
    expect(mocks.FloatingActionButton).not.toHaveBeenCalled();
    expect(mocks.ScrollToTopButton).not.toHaveBeenCalled();
    expect(mocks.DayTransactionsModal).toHaveBeenCalled();
  });

  it('does not render the inline transaction list', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(jest.requireMock('@components/index').FilteredTransactionList).not.toHaveBeenCalled();
  });

  it('does not render a search input', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    expect(screen.queryByTestId('search-input')).toBeNull();
    expect(screen.queryByPlaceholderText(/Search/)).toBeNull();
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

  it('renders net total section inside a card container', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const summaryLabel = screen.getByText(/Net total ·/);
    expect(summaryLabel).toBeTruthy();
  });

  it('does not render any divider elements', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    const { toJSON } = render(<TransactionListScreen />);
    const tree = JSON.stringify(toJSON());

    expect(tree).not.toMatch(/summaryDivider/);
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

  const lastProps = (name: string) => {
    const mock = jest.requireMock('@components/index')[name];
    return mock.mock.calls[mock.mock.calls.length - 1][0];
  };

  it('opens the day popup with the tapped date and keeps the month net total', () => {
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

    expect(lastProps('DayTransactionsModal').date).toBeNull();

    act(() => {
      lastProps('MonthCalendar').onDayPress(10);
    });

    expect(lastProps('DayTransactionsModal').date).toEqual(new Date(2026, 6, 10));
    expect(lastProps('MonthCalendar').selectedDay).toBe(10);

    expect(screen.getByText(/Net total · Jul 2026/)).toBeTruthy();
    expect(screen.getByText(/\+70\.000/)).toBeTruthy();
  });

  it('closes the popup and clears the highlight when onClose is called', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    act(() => {
      lastProps('MonthCalendar').onDayPress(10);
    });
    expect(lastProps('DayTransactionsModal').date).toEqual(new Date(2026, 6, 10));

    act(() => {
      lastProps('DayTransactionsModal').onClose();
    });

    expect(lastProps('DayTransactionsModal').date).toBeNull();
    expect(lastProps('MonthCalendar').selectedDay).toBeNull();
  });

  it('closes the popup when the active day is tapped again', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    act(() => {
      lastProps('MonthCalendar').onDayPress(10);
    });
    // The real calendar converts a re-tap of the active day into onDayPress(null)
    act(() => {
      lastProps('MonthCalendar').onDayPress(null);
    });

    expect(lastProps('DayTransactionsModal').date).toBeNull();
    expect(lastProps('MonthCalendar').selectedDay).toBeNull();
  });

  it('closes the popup and navigates to EditTransaction when a popup row is pressed', () => {
    const { __mockNavigate: mockNavigate } = require('@react-navigation/native');
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    act(() => {
      lastProps('MonthCalendar').onDayPress(10);
    });
    act(() => {
      lastProps('DayTransactionsModal').onTransactionPress({ id: 'tx-9' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('EditTransaction', { transactionId: 'tx-9' });
    expect(lastProps('DayTransactionsModal').date).toBeNull();
  });

  it('closes the day popup when month changed via calendar picker', () => {
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onMonthChange(7);
    });

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.month).toBe(7);
    expect(calProps.selectedDay).toBeNull();
    expect(lastProps('DayTransactionsModal').date).toBeNull();
  });

  it('clears selected day when screen gains focus', () => {
    const {
      __triggerFocus: triggerFocus,
      __resetFocusCallback,
    } = require('@react-navigation/native');
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);
    __resetFocusCallback();

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(10);
    });
    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(10);

    act(() => {
      triggerFocus();
    });

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBeNull();
  });

  it('clears day selection on re-focus after navigating away', () => {
    const {
      __triggerFocus: triggerFocus,
      __resetFocusCallback,
    } = require('@react-navigation/native');
    (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

    render(<TransactionListScreen />);
    __resetFocusCallback();

    const MonthCalendar = jest.requireMock('@components/index').MonthCalendar;
    let calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    act(() => {
      calProps.onDayPress(25);
    });
    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBe(25);

    act(() => {
      triggerFocus();
    });

    calProps = MonthCalendar.mock.calls[MonthCalendar.mock.calls.length - 1][0];
    expect(calProps.selectedDay).toBeNull();
  });
});
