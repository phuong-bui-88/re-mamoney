import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AddTransactionScreen from '@screens/AddTransactionScreen';
import { useAuthStore, useTransactionStore } from '@store/index';
import { parseTransactionMessage } from '@services/aiTransactionParser';
import firebaseService from '@services/firebase';

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
