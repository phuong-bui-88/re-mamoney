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

describe('AddTransactionScreen - raw lines panel', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  it('shows raw lines when userText has multiple lines', () => {
    const userText = 'Coffee 30k\nTea 15k\nSnack 10k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl1', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    expect(screen.getByText('Coffee 30k')).toBeTruthy();
    expect(screen.getByText('Tea 15k')).toBeTruthy();
    expect(screen.getByText('Snack 10k')).toBeTruthy();
  });

  it('limits raw lines to 5 when more than 5 lines', () => {
    const userText = 'Line1 10k\nLine2 20k\nLine3 30k\nLine4 40k\nLine5 50k\nLine6 60k\nLine7 70k\nLine8 80k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl2', userId: 'test-user', type: 'expense', amount: 10000, category: 'food', description: 'Line1', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl2', userId: 'test-user', type: 'expense', amount: 10000, category: 'food', description: 'Line1', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    expect(screen.getByText('Line1 10k')).toBeTruthy();
    expect(screen.getByText('Line2 20k')).toBeTruthy();
    expect(screen.getByText('Line3 30k')).toBeTruthy();
    expect(screen.getByText('Line4 40k')).toBeTruthy();
    expect(screen.getByText('Line5 50k')).toBeTruthy();
    expect(screen.queryByText('Line6 60k')).toBeNull();
    expect(screen.queryByText('Line7 70k')).toBeNull();
    expect(screen.queryByText('Line8 80k')).toBeNull();
  });

  it('highlights only the matching line in the raw lines panel', () => {
    const userText = 'Hủ tiếu 25k\nCơm 60k\nKẹo 16k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl3', userId: 'test-user', type: 'expense', amount: 60000, category: 'food', description: 'Cơm', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl3', userId: 'test-user', type: 'expense', amount: 60000, category: 'food', description: 'Cơm', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    const LINES = ['Hủ tiếu 25k', 'Cơm 60k', 'Kẹo 16k'];
    const rawNodes = screen.root.findAll(
      (node: any) =>
        typeof node.children?.join('') === 'string' &&
        LINES.includes(node.children.join('')),
    );
    expect(rawNodes).toHaveLength(3);

    const highlighted: number[] = [];
    rawNodes.forEach((node: any, i: number) => {
      const style = node.props.style;
      const isMatch =
        Array.isArray(style) &&
        style.some((s: any) => s && s.borderLeftWidth === 3 && s.borderLeftColor === '#2196F3');
      if (isMatch) highlighted.push(i);
    });

    expect(highlighted).toEqual([1]);
    expect(rawNodes[1].children.join('')).toBe('Cơm 60k');
  });

  it('shows single-line userText without raw lines panel', () => {
    const userText = 'Coffee 30k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl4', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl4', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'Coffee', date: today, createdAt: new Date(), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    const coffeeTexts = screen.getAllByText('Coffee 30k');
    expect(coffeeTexts.length).toBe(1);
  });

  it('does not show raw lines panel when userText is missing', () => {
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl5', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'NoText', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
      transactions: [
        { id: 'tx-rl5', userId: 'test-user', type: 'expense', amount: 30000, category: 'food', description: 'NoText', date: today, createdAt: new Date(), updatedAt: new Date() },
      ],
    });

    render(<AddTransactionScreen />);

    expect(screen.getByText('NoText')).toBeTruthy();
    expect(screen.getByText('-30000')).toBeTruthy();
  });

  it('highlights each duplicate-description card on its own line', () => {
    const userText = 'Hủ tiếu 25k\nHủ tiếu 25k\nĐổ xăng 50k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl7a', userId: 'test-user', type: 'expense', amount: 25000, category: 'food', description: 'Hủ tiếu', date: today, createdAt: new Date(2026, 6, 27, 10, 0), updatedAt: new Date(), userText },
        { id: 'tx-rl7b', userId: 'test-user', type: 'expense', amount: 25000, category: 'food', description: 'Hủ tiếu', date: today, createdAt: new Date(2026, 6, 27, 10, 1), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl7a', userId: 'test-user', type: 'expense', amount: 25000, category: 'food', description: 'Hủ tiếu', date: today, createdAt: new Date(2026, 6, 27, 10, 0), updatedAt: new Date(), userText },
        { id: 'tx-rl7b', userId: 'test-user', type: 'expense', amount: 25000, category: 'food', description: 'Hủ tiếu', date: today, createdAt: new Date(2026, 6, 27, 10, 1), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    const LINES = ['Hủ tiếu 25k', 'Đổ xăng 50k'];
    const rawLineNodes = screen.root.findAll(
      (node: any) =>
        typeof node.children?.join('') === 'string' &&
        LINES.includes(node.children.join('')),
    );
    const texts = rawLineNodes.map((n: any) => n.children.join(''));

    expect(texts.filter((t: string) => t === 'Hủ tiếu 25k').length).toBe(4);

    const isMatch = (n: any): boolean => {
      const style = n.props.style;
      return (
        Array.isArray(style) &&
        style.some((s: any) => s && s.borderLeftWidth === 3 && s.borderLeftColor === '#2196F3')
      );
    };
    const highlighted: number[] = [];
    rawLineNodes.forEach((n: any, i: number) => { if (isMatch(n)) highlighted.push(i); });
    expect(highlighted).toEqual([0, 4]);
    expect(highlighted.map((i: number) => texts[i])).toEqual(['Hủ tiếu 25k', 'Hủ tiếu 25k']);
  });

  it('jumps to page [4-7] for cards matching lines 5-6 (8-line paste)', () => {
    const userText = 'Line0 10k\nLine1 20k\nLine2 30k\nLine3 40k\nLine4 50k\nLine5 60k\nLine6 70k\nLine7 80k';
    useTransactionStore.setState({
      allTransactions: [
        { id: 'tx-rl6a', userId: 'test-user', type: 'expense', amount: 60000, category: 'food', description: 'Line5', date: today, createdAt: new Date(2026, 6, 27, 10, 0), updatedAt: new Date(), userText },
        { id: 'tx-rl6b', userId: 'test-user', type: 'expense', amount: 70000, category: 'food', description: 'Line6', date: today, createdAt: new Date(2026, 6, 27, 10, 1), updatedAt: new Date(), userText },
      ],
      transactions: [
        { id: 'tx-rl6a', userId: 'test-user', type: 'expense', amount: 60000, category: 'food', description: 'Line5', date: today, createdAt: new Date(2026, 6, 27, 10, 0), updatedAt: new Date(), userText },
        { id: 'tx-rl6b', userId: 'test-user', type: 'expense', amount: 70000, category: 'food', description: 'Line6', date: today, createdAt: new Date(2026, 6, 27, 10, 1), updatedAt: new Date(), userText },
      ],
    });

    render(<AddTransactionScreen />);

    const LINES = ['Line4 50k', 'Line5 60k', 'Line6 70k', 'Line7 80k'];
    const rawNodes = screen.root.findAll(
      (node: any) =>
        typeof node.children?.join('') === 'string' &&
        LINES.includes(node.children.join('')),
    );
    const texts = rawNodes.map((n: any) => n.children.join(''));

    expect(texts).toHaveLength(8);
    expect(texts.filter((t: string) => t === 'Line4 50k').length).toBe(2);
    expect(texts.filter((t: string) => t === 'Line5 60k').length).toBe(2);
    expect(texts.filter((t: string) => t === 'Line6 70k').length).toBe(2);
    expect(texts.filter((t: string) => t === 'Line7 80k').length).toBe(2);

    expect(screen.queryByText('Line0 10k')).toBeNull();
    expect(screen.queryByText('Line1 20k')).toBeNull();

    const isMatch = (n: any): boolean => {
      const style = n.props.style;
      return (
        Array.isArray(style) &&
        style.some((s: any) => s && s.borderLeftWidth === 3 && s.borderLeftColor === '#2196F3')
      );
    };
    const highlighted: number[] = [];
    rawNodes.forEach((n: any, i: number) => { if (isMatch(n)) highlighted.push(i); });
    expect(highlighted).toEqual([1, 6]);
    expect(rawNodes[1].children.join('')).toBe('Line5 60k');
    expect(rawNodes[6].children.join('')).toBe('Line6 70k');
  });

  it('keeps page-jump windows across a 6-line batch', () => {
    const userText =
      'Hủ tiếu 25k\nHủ tiếu 25k\nĐổ xăng 50k\nĐổi bình nước 50 K\nĐặt xe 40 K\nBánh tráng trộn 20k';
    const mkTx = (id: string, description: string, amount: number, createdAt: Date) => ({
      id,
      userId: 'test-user',
      type: 'expense' as const,
      amount,
      category: 'food',
      description,
      date: today,
      createdAt,
      updatedAt: new Date(),
      userText,
    });
    const all = [
      mkTx('tx-6a', 'Hủ tiếu', 25000, new Date(2026, 6, 27, 10, 0)),
      mkTx('tx-6b', 'Hủ tiếu', 25000, new Date(2026, 6, 27, 10, 1)),
      mkTx('tx-6c', 'Đổ xăng', 50000, new Date(2026, 6, 27, 10, 2)),
      mkTx('tx-6d', 'Đổi bình nước', 50000, new Date(2026, 6, 27, 10, 3)),
      mkTx('tx-6e', 'Đặt xe', 40000, new Date(2026, 6, 27, 10, 4)),
      mkTx('tx-6f', 'Bánh tráng trộn', 20000, new Date(2026, 6, 27, 10, 5)),
    ];
    useTransactionStore.setState({ allTransactions: all, transactions: all });

    render(<AddTransactionScreen />);

    const LINES = ['Hủ tiếu 25k', 'Đổ xăng 50k', 'Đổi bình nước 50 K', 'Đặt xe 40 K', 'Bánh tráng trộn 20k'];
    const rawLineNodes = screen.root.findAll(
      (node: any) =>
        typeof node.children?.join('') === 'string' &&
        LINES.includes(node.children.join('')),
    );

    const texts = rawLineNodes.map((n: any) => n.children.join(''));

    expect(texts.filter((t: string) => t === 'Hủ tiếu 25k').length).toBe(10);
    expect(texts.filter((t: string) => t === 'Đổ xăng 50k').length).toBe(5);
    expect(texts.filter((t: string) => t === 'Đổi bình nước 50 K').length).toBe(5);
    expect(texts.filter((t: string) => t === 'Đặt xe 40 K').length).toBe(6);
    expect(texts.filter((t: string) => t === 'Bánh tráng trộn 20k').length).toBe(1);

    const lastTwo = texts.slice(-2);
    expect(lastTwo).toEqual(['Đặt xe 40 K', 'Bánh tráng trộn 20k']);

    const isMatch = (n: any): boolean => {
      const style = n.props.style;
      return (
        Array.isArray(style) &&
        style.some((s: any) => s && s.borderLeftWidth === 3 && s.borderLeftColor === '#2196F3')
      );
    };
    const highlighted: number[] = [];
    rawLineNodes.forEach((n: any, i: number) => { if (isMatch(n)) highlighted.push(i); });
    expect(highlighted).toEqual([0, 6, 12, 18, 24, 26]);
    expect(isMatch(rawLineNodes[rawLineNodes.length - 1])).toBe(true);
  });

  it('13-line paste: 13 cards page through [0-4]/[4-8]/[8-12], each highlights its own line', () => {
    const pasteLines = [
      'Hủ tiếu 25k', 'Chè mè đen 15k', 'Hủ tiếu 25k', 'Hủ tiếu 25 K', 'Bánh mì 30 K',
      'Hủ tiếu 25 K', 'Cơm 60k', 'Cơm sườn 30k', 'Kẹo 16k', 'Dầu gió 20k',
      'Khoai lang 20k', 'Hủ tiếu 25 K', 'Bánh bèo 15k',
    ];
    const userText = pasteLines.join('\n');

    const mkTx = (id: string, description: string, amount: number, min: number) => ({
      id,
      userId: 'test-user',
      type: 'expense' as const,
      amount,
      category: 'food',
      description,
      date: today,
      createdAt: new Date(2026, 6, 27, 10, min),
      updatedAt: new Date(),
      userText,
    });
    const all = [
      mkTx('tx-13a', 'Hủ tiếu', 25000, 0),
      mkTx('tx-13b', 'Chè mè đen', 15000, 1),
      mkTx('tx-13c', 'Hủ tiếu', 25000, 2),
      mkTx('tx-13d', 'Hủ tiếu', 25000, 3),
      mkTx('tx-13e', 'Bánh mì', 30000, 4),
      mkTx('tx-13f', 'Hủ tiếu', 25000, 5),
      mkTx('tx-13g', 'Cơm', 60000, 6),
      mkTx('tx-13h', 'Cơm sườn', 30000, 7),
      mkTx('tx-13i', 'Kẹo', 16000, 8),
      mkTx('tx-13j', 'Dầu gió', 20000, 9),
      mkTx('tx-13k', 'Khoai lang', 20000, 10),
      mkTx('tx-13l', 'Hủ tiếu', 25000, 11),
      mkTx('tx-13m', 'Bánh bèo', 15000, 12),
    ];
    useTransactionStore.setState({ allTransactions: all, transactions: all });

    render(<AddTransactionScreen />);

    const DISTINCT_LINES = [
      'Hủ tiếu 25k', 'Chè mè đen 15k', 'Hủ tiếu 25 K', 'Bánh mì 30 K',
      'Cơm 60k', 'Cơm sườn 30k', 'Kẹo 16k', 'Dầu gió 20k',
      'Khoai lang 20k', 'Bánh bèo 15k',
    ];
    const rawLineNodes = screen.root.findAll(
      (node: any) =>
        typeof node.children?.join('') === 'string' &&
        DISTINCT_LINES.includes(node.children.join('')),
    );
    const texts = rawLineNodes.map((n: any) => n.children.join(''));

    expect(texts).toHaveLength(65);

    const count = (t: string): number => texts.filter((x: string) => x === t).length;
    expect(count('Hủ tiếu 25k')).toBe(10);
    expect(count('Hủ tiếu 25 K')).toBe(13);
    expect(count('Bánh mì 30 K')).toBe(9);
    expect(count('Kẹo 16k')).toBe(8);
    expect(count('Chè mè đen 15k')).toBe(5);
    expect(count('Cơm 60k')).toBe(4);
    expect(count('Cơm sườn 30k')).toBe(4);
    expect(count('Dầu gió 20k')).toBe(4);
    expect(count('Khoai lang 20k')).toBe(4);
    expect(count('Bánh bèo 15k')).toBe(4);

    const isMatch = (n: any): boolean => {
      const style = n.props.style;
      return (
        Array.isArray(style) &&
        style.some((s: any) => s && s.borderLeftWidth === 3 && s.borderLeftColor === '#2196F3')
      );
    };
    const highlighted: number[] = [];
    rawLineNodes.forEach((n: any, i: number) => { if (isMatch(n)) highlighted.push(i); });

    expect(highlighted).toEqual([0, 6, 12, 18, 24, 26, 32, 38, 44, 46, 52, 58, 64]);

    const highlightedTexts = highlighted.map((i: number) => texts[i]);
    expect(highlightedTexts).toEqual(pasteLines);
  });
});
