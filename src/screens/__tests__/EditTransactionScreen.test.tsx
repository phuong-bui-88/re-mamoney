import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import EditTransactionScreen from '@screens/EditTransactionScreen';
import { useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';

jest.useFakeTimers();

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: { transactionId: 'tx-1' },
  }),
}));

jest.mock('@utils/currency', () => ({
  formatCurrency: jest.fn((v: number) => `${v}`),
  formatDate: jest.fn(() => '01/07/2026'),
  getMonthStart: jest.fn((d: Date) => d),
  getMonthEnd: jest.fn((d: Date) => d),
}));

jest.mock('@utils/dateParser', () => ({
  parseDate: jest.fn((d: string) => new Date(d)),
}));

jest.mock('@utils/categories', () => ({
  CATEGORY_ICONS: { food: 'restaurant-outline' },
  CATEGORY_LABELS: { food: 'Food' },
  CATEGORY_COLORS: { food: '#000' },
  FALLBACK_COLORS: ['#ccc'],
  EXPENSE_CATEGORIES: ['food'],
  INCOME_CATEGORIES: ['salary'],
}));

const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense' as const,
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date('2026-07-01T10:00:00'),
  createdAt: new Date('2026-07-01T10:00:00'),
  updatedAt: new Date('2026-07-01T10:00:00'),
};

beforeEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();

  (firebaseService.updateTransaction as jest.Mock).mockResolvedValue(undefined);

  useTransactionStore.setState({
    allTransactions: [mockTransaction],
    transactions: [mockTransaction],
    periodStart: null,
    periodEnd: null,
    totalIncome: 0,
    totalExpense: 50000,
    balance: -50000,
    isLoading: false,
    error: null,
  });
});

describe('EditTransactionScreen', () => {
  it('renders with correct fields when navigated to with valid transactionId', () => {
    render(<EditTransactionScreen />);

    expect(screen.getByDisplayValue('Lunch')).toBeTruthy();
    expect(screen.getByDisplayValue('50')).toBeTruthy();
    expect(screen.getByText('Expense')).toBeTruthy();
    expect(screen.getByText('Food')).toBeTruthy();
  });

  it('goes back gracefully if transactionId not found in store', () => {
    useTransactionStore.setState({
      allTransactions: [],
      transactions: [],
    });

    render(<EditTransactionScreen />);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('save calls updateTransaction with correct id', async () => {
    render(<EditTransactionScreen />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(firebaseService.updateTransaction).toHaveBeenCalledWith(
        'tx-1',
        expect.objectContaining({
          description: 'Lunch',
          amount: 50000,
          category: 'food',
        }),
      );
    });
  });

  it('navigates back after successful save', async () => {
    render(<EditTransactionScreen />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
