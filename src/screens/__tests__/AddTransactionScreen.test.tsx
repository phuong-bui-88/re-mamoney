import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AddTransactionScreen from '@screens/AddTransactionScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import { parseTransactionMessage } from '@services/aiTransactionParser';
import firebaseService from '@services/firebase';
import * as Clipboard from 'expo-clipboard';

const mockSwipeCalls: Array<((id: string) => void) | null> = [];
jest.mock('react-native-gesture-handler/Swipeable', () => {
  const React = require('react');
  return ({ children, onSwipeableLeftOpen }: any) => {
    React.useEffect(() => {
      mockSwipeCalls.push(onSwipeableLeftOpen || null);
      return () => {
        mockSwipeCalls.length = 0;
      };
    }, []);
    return children;
  };
});

jest.useFakeTimers();

jest.mock('@utils/dateParser', () => ({
  parseDate: jest.fn((d: string) => new Date(d)),
}));

jest.mock('@utils/currency', () => ({
  formatCurrency: jest.fn((v: number) => `${v}`),
  formatDate: jest.fn(() => 'Jan 1'),
  getMonthStart: jest.fn((d: Date) => d),
  getMonthEnd: jest.fn((d: Date) => d),
}));

jest.mock('@react-navigation/native', () => {
  const mockNavigate = jest.fn();
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    __mockNavigate: mockNavigate,
  };
});

jest.mock('@utils/categories', () => ({
  CATEGORY_ICONS: { food: 'restaurant' },
  CATEGORY_LABELS: { food: 'Food' },
  CATEGORY_COLORS: { food: '#000' },
  FALLBACK_COLORS: ['#ccc'],
}));

beforeEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();

  (firebaseService.addTransaction as jest.Mock).mockResolvedValue({
    id: 'tx-1',
    userId: 'test-user',
    type: 'expense',
    amount: 30000,
    category: 'food',
    description: 'Coffee',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());

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

describe('AddTransactionScreen - keyboard re-focus', () => {
  it('input has autoFocus on mount', () => {
    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');
    expect(input.props.autoFocus).toBe(true);
  });

  it('clears input after successful submit and loading returns to false', async () => {
    (parseTransactionMessage as jest.Mock).mockResolvedValue({
      transactions: [
        {
          type: 'expense',
          amount: 30000,
          category: 'food',
          description: 'Coffee',
          date: '2026-01-01',
        },
      ],
      followUpQuestion: null,
    });

    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => {
      fireEvent.changeText(input, 'Coffee 30k');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Send'));
    });

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });

    expect(useTransactionStore.getState().isLoading).toBe(false);
  });

  it('clears input after parse error and loading returns to false', async () => {
    (parseTransactionMessage as jest.Mock).mockResolvedValue({
      transactions: [],
      followUpQuestion: 'Could you clarify?',
    });

    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => {
      fireEvent.changeText(input, 'blah blah');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Send'));
    });

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });

    expect(useTransactionStore.getState().isLoading).toBe(false);
  });

  it('clears input after addTransaction throws and loading returns to false', async () => {
    (parseTransactionMessage as jest.Mock).mockResolvedValue({
      transactions: [
        {
          type: 'expense',
          amount: 10000,
          category: 'food',
          description: 'Snack',
          date: '2026-01-01',
        },
      ],
      followUpQuestion: null,
    });

    (firebaseService.addTransaction as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => {
      fireEvent.changeText(input, 'Snack 10k');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Send'));
    });

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });

    expect(useTransactionStore.getState().isLoading).toBe(false);
  });

  it('send button is disabled when input is empty', () => {
    render(<AddTransactionScreen />);
    const sendButton = screen.getByText('Send');
    expect(sendButton.parent?.props.accessibilityState?.disabled ?? true).toBe(true);
  });
});

describe('AddTransactionScreen - feed sort order', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  it('same-date items appear in createdAt order (oldest first)', () => {
    const txA = {
      id: 'tx-a', userId: 'test-user', type: 'expense' as const,
      amount: 10000, category: 'food', description: 'First',
      date: new Date(today), createdAt: new Date(2026, 6, 14, 10, 0), updatedAt: new Date(),
    };
    const txB = {
      id: 'tx-b', userId: 'test-user', type: 'expense' as const,
      amount: 20000, category: 'food', description: 'Second',
      date: new Date(today), createdAt: new Date(2026, 6, 14, 10, 5), updatedAt: new Date(),
    };
    const txC = {
      id: 'tx-c', userId: 'test-user', type: 'expense' as const,
      amount: 30000, category: 'food', description: 'Third',
      date: new Date(today), createdAt: new Date(2026, 6, 14, 10, 10), updatedAt: new Date(),
    };

    useTransactionStore.setState({
      allTransactions: [txC, txA, txB],
      transactions: [txC, txA, txB],
    });

    render(<AddTransactionScreen />);

    const descriptions = screen.getAllByText(/^(First|Second|Third)$/);
    expect(descriptions).toHaveLength(3);
    expect(descriptions[0].props.children).toBe('First');
    expect(descriptions[1].props.children).toBe('Second');
    expect(descriptions[2].props.children).toBe('Third');
  });

  it('different-date items sort by date first, createdAt second', () => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const txOld = {
      id: 'tx-old', userId: 'test-user', type: 'expense' as const,
      amount: 10000, category: 'food', description: 'Yesterday',
      date: new Date(yesterday), createdAt: new Date(2026, 6, 13, 10, 10), updatedAt: new Date(),
    };
    const txNew1 = {
      id: 'tx-new1', userId: 'test-user', type: 'expense' as const,
      amount: 20000, category: 'food', description: 'Today-First',
      date: new Date(today), createdAt: new Date(2026, 6, 14, 10, 0), updatedAt: new Date(),
    };
    const txNew2 = {
      id: 'tx-new2', userId: 'test-user', type: 'expense' as const,
      amount: 30000, category: 'food', description: 'Today-Second',
      date: new Date(today), createdAt: new Date(2026, 6, 14, 10, 5), updatedAt: new Date(),
    };

    useTransactionStore.setState({
      allTransactions: [txNew2, txOld, txNew1],
      transactions: [txNew2, txOld, txNew1],
    });

    render(<AddTransactionScreen />);

    const descriptions = screen.getAllByText(/^(Yesterday|Today-First|Today-Second)$/);
    expect(descriptions).toHaveLength(3);
    expect(descriptions[0].props.children).toBe('Yesterday');
    expect(descriptions[1].props.children).toBe('Today-First');
    expect(descriptions[2].props.children).toBe('Today-Second');
  });
});

describe('AddTransactionScreen - paste button', () => {
  it('renders paste button when input is empty', () => {
    render(<AddTransactionScreen />);
    const pasteButton = screen.getByLabelText('Paste from clipboard');
    expect(pasteButton).toBeTruthy();
  });

  it('pastes clipboard content into input', async () => {
    (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('Coffee 30k');
    render(<AddTransactionScreen />);

    const pasteButton = screen.getByLabelText('Paste from clipboard');
    await act(async () => {
      fireEvent.press(pasteButton);
    });

    const input = screen.getByPlaceholderText('What did you spend?');
    expect(input.props.value).toBe('Coffee 30k');
  });

  it('does not paste when clipboard is empty', async () => {
    (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('');
    render(<AddTransactionScreen />);

    const pasteButton = screen.getByLabelText('Paste from clipboard');
    await act(async () => {
      fireEvent.press(pasteButton);
    });

    const input = screen.getByPlaceholderText('What did you spend?');
    expect(input.props.value).toBe('');
  });

  it('hides paste button when input has text', async () => {
    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => {
      fireEvent.changeText(input, 'Coffee 30k');
    });

    expect(screen.queryByLabelText('Paste from clipboard')).toBeNull();
  });

  it('shows paste button again after input is cleared', async () => {
    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => {
      fireEvent.changeText(input, 'Coffee 30k');
    });
    expect(screen.queryByLabelText('Paste from clipboard')).toBeNull();

    await act(async () => {
      fireEvent.changeText(input, '');
    });
    expect(screen.getByLabelText('Paste from clipboard')).toBeTruthy();
  });
});

describe('AddTransactionScreen - tap to edit', () => {
  it('navigates to EditTransaction when stored transaction bubble is tapped', () => {
    const { __mockNavigate: mockNavigate } = require('@react-navigation/native');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-edit-1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
      transactions: [
        { id: 'tx-edit-1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    render(<AddTransactionScreen />);

    const bubble = screen.getByText('Coffee');
    fireEvent.press(bubble);

    expect(mockNavigate).toHaveBeenCalledWith('EditTransaction', { transactionId: 'tx-edit-1' });
  });

  it('error bubbles are not tappable for edit', async () => {
    const { __mockNavigate: mockNavigate } = require('@react-navigation/native');

    (parseTransactionMessage as jest.Mock).mockResolvedValue({
      transactions: [],
      followUpQuestion: 'Could you clarify?',
    });

    render(<AddTransactionScreen />);
    const input = screen.getByPlaceholderText('What did you spend?');

    await act(async () => { fireEvent.changeText(input, 'blah blah'); });
    await act(async () => { fireEvent.press(screen.getByText('Send')); });

    await waitFor(() => {
      expect(screen.getByText(/Could you clarify/)).toBeTruthy();
    });

    const errorBubble = screen.getByText(/Could you clarify/);
    fireEvent.press(errorBubble);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('AddTransactionScreen - swipe to delete', () => {
  it('renders Swipeable wrapper for each stored feed item', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-s1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'SwipeMe', date: today, createdAt: new Date(), updatedAt: new Date() },
        { id: 'tx-s2', userId: 'test-user', type: 'expense', amount: 50000, category: 'food', description: 'SwipeMeToo', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
      transactions: [
        { id: 'tx-s1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'SwipeMe', date: today, createdAt: new Date(), updatedAt: new Date() },
        { id: 'tx-s2', userId: 'test-user', type: 'expense', amount: 50000, category: 'food', description: 'SwipeMeToo', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    render(<AddTransactionScreen />);

    expect(screen.getByText('SwipeMe')).toBeTruthy();
    expect(screen.getByText('SwipeMeToo')).toBeTruthy();
    expect(mockSwipeCalls.length).toBe(2);
    mockSwipeCalls.forEach((cb) => {
      expect(cb).toEqual(expect.any(Function));
    });
  });

  it('deleting a transaction removes it from the feed', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    useTransactionStore.setState({
      periodStart: today,
      periodEnd: endOfDay,
      allTransactions: [
        { id: 'tx-d1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'ToDelete', date: today, createdAt: new Date(), updatedAt: new Date() },
        { id: 'tx-d2', userId: 'test-user', type: 'expense', amount: 50000, category: 'food', description: 'KeepMe', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
      transactions: [
        { id: 'tx-d1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'ToDelete', date: today, createdAt: new Date(), updatedAt: new Date() },
        { id: 'tx-d2', userId: 'test-user', type: 'expense', amount: 50000, category: 'food', description: 'KeepMe', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    render(<AddTransactionScreen />);

    expect(screen.getByText('ToDelete')).toBeTruthy();
    expect(screen.getByText('KeepMe')).toBeTruthy();

    await act(async () => {
      await useTransactionStore.getState().deleteTransaction('tx-d1');
    });

    expect(screen.queryByText('ToDelete')).toBeNull();
    expect(screen.getByText('KeepMe')).toBeTruthy();
  });

  it('add_screen_mock_captures_left_open_callback', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-l1', userId: 'test-user', type: 'expense', amount: 10000, category: 'food',
          description: 'LeftSwipe', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
      transactions: [
        { id: 'tx-l1', userId: 'test-user', type: 'expense', amount: 10000, category: 'food',
          description: 'LeftSwipe', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
    });
    render(<AddTransactionScreen />);
    expect(screen.getByText('LeftSwipe')).toBeTruthy();
    expect(mockSwipeCalls.length).toBe(1);
    expect(mockSwipeCalls[0]).toEqual(expect.any(Function));
  });
});
