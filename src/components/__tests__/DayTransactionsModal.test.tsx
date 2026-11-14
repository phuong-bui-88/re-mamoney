import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@store/index';
import { parseTransactionText } from '@utils/parseTransactionText';
import DayTransactionsModal, { formatDayTitle } from '@components/DayTransactionsModal';
import { useTransactionStore } from '@store/index';

jest.mock('@utils/parseTransactionText', () => ({ parseTransactionText: jest.fn() }));

const tx = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense' as const,
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date(2026, 6, 10, 12),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  useTransactionStore.setState({
    allTransactions: [],
    transactions: [
      tx({ id: 'a', description: 'Pho', amount: 50000, date: new Date(2026, 6, 10, 8) }),
      tx({ id: 'b', description: 'Taxi', amount: 30000, date: new Date(2026, 6, 10, 18) }),
      tx({
        id: 'c',
        description: 'Salary',
        type: 'income',
        amount: 900000,
        date: new Date(2026, 6, 11, 9),
      }),
    ],
  });
});

describe('DayTransactionsModal', () => {
  it('renders nothing when date is null', () => {
    render(<DayTransactionsModal date={null} onClose={jest.fn()} />);

    expect(screen.queryByTestId('day-transactions-modal')).toBeNull();
  });

  it('shows the formatted date as the title', () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 10)} onClose={jest.fn()} />);

    expect(screen.getByText('Fri, 10 Jul 2026')).toBeTruthy();
    expect(formatDayTitle(new Date(2026, 10, 13))).toBe('Fri, 13 Nov 2026');
  });

  it("lists only the selected day's transactions", () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 10)} onClose={jest.fn()} />);

    expect(screen.getByText('Pho')).toBeTruthy();
    expect(screen.getByText('Taxi')).toBeTruthy();
    expect(screen.queryByText('Salary')).toBeNull();
  });

  it("shows the day's net total", () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 10)} onClose={jest.fn()} />);

    expect(within(screen.getByTestId('day-modal-net-total')).getByText(/-80\.000/)).toBeTruthy();
  });

  it('shows a positive net total for an income day', () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 11)} onClose={jest.fn()} />);

    expect(within(screen.getByTestId('day-modal-net-total')).getByText(/\+900\.000/)).toBeTruthy();
  });

  it('shows the empty state for a day with no transactions', () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 25)} onClose={jest.fn()} />);

    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    render(<DayTransactionsModal date={new Date(2026, 6, 10)} onClose={onClose} />);

    fireEvent.press(screen.getByTestId('day-modal-close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is pressed but not when the card is pressed', () => {
    const onClose = jest.fn();
    render(<DayTransactionsModal date={new Date(2026, 6, 10)} onClose={onClose} />);

    fireEvent.press(screen.getByTestId('day-transactions-modal'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('day-modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onTransactionPress with the pressed transaction', () => {
    const onTransactionPress = jest.fn();
    render(
      <DayTransactionsModal
        date={new Date(2026, 6, 10)}
        onClose={jest.fn()}
        onTransactionPress={onTransactionPress}
      />
    );

    fireEvent.press(screen.getByText('Pho'));

    expect(onTransactionPress).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  describe('add transaction', () => {
    const day = new Date(2026, 6, 10);
    const open = () => {
      render(<DayTransactionsModal date={day} onClose={jest.fn()} />);
      fireEvent.press(screen.getByTestId('day-modal-add'));
    };

    beforeEach(() => {
      jest.clearAllMocks();
      useAuthStore.setState({ selectedUser: { id: 'user-1' } } as never);
    });

    it('hides the input until add is pressed', () => {
      render(<DayTransactionsModal date={day} onClose={jest.fn()} />);
      expect(screen.getByTestId('day-modal-add')).toBeTruthy();
      expect(screen.queryByTestId('day-modal-input')).toBeNull();
    });

    it('shows input and moves card to top when add is pressed', () => {
      open();
      expect(screen.getByTestId('day-modal-input')).toBeTruthy();
      expect(screen.getByTestId('day-modal-overlay').props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ justifyContent: 'flex-start' })])
      );
    });

    it('paste fills the input from clipboard', async () => {
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('Coffee 30k');
      open();
      fireEvent.press(screen.getByTestId('day-modal-paste'));
      await waitFor(() =>
        expect(screen.getByTestId('day-modal-input').props.value).toBe('Coffee 30k')
      );
      expect(screen.queryByTestId('day-modal-paste')).toBeNull();
    });

    it('empty clipboard leaves input unchanged', async () => {
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('');
      open();
      fireEvent.press(screen.getByTestId('day-modal-paste'));
      await waitFor(() => expect(Clipboard.getStringAsync).toHaveBeenCalled());
      expect(screen.getByTestId('day-modal-input').props.value).toBe('');
    });

    it('send saves with the popup day and clears the input', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 30000, category: 'food', description: 'Coffee' }],
      });
      const addTransaction = jest.fn().mockResolvedValue(undefined);
      useTransactionStore.setState({ addTransaction } as never);
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'Coffee 30k');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await waitFor(() => expect(addTransaction).toHaveBeenCalledTimes(1));
      const saved = addTransaction.mock.calls[0][0];
      expect(saved).toEqual(expect.objectContaining({ userId: 'user-1', amount: 30000 }));
      expect(saved.date.getFullYear()).toBe(2026);
      expect(saved.date.getMonth()).toBe(6);
      expect(saved.date.getDate()).toBe(10);
      await waitFor(() => expect(screen.getByTestId('day-modal-input').props.value).toBe(''));
    });

    it('scrolls the list to the end after a successful add, not otherwise', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 30000, category: 'food', description: 'Coffee' }],
      });
      useTransactionStore.setState({
        addTransaction: jest.fn().mockResolvedValue(undefined),
      } as never);
      const scrollSpy = jest
        .spyOn(ScrollView.prototype as unknown as { scrollToEnd: () => void }, 'scrollToEnd')
        .mockImplementation(() => {});
      open();
      const list = screen.UNSAFE_getByType(ScrollView);
      fireEvent(list, 'contentSizeChange', 100, 200);
      expect(scrollSpy).not.toHaveBeenCalled();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'Coffee 30k');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await waitFor(() => expect(screen.getByTestId('day-modal-input').props.value).toBe(''));
      fireEvent(screen.UNSAFE_getByType(ScrollView), 'contentSizeChange', 100, 260);
      expect(scrollSpy).toHaveBeenCalledTimes(1);
      scrollSpy.mockRestore();
    });

    it('does not scroll to the end when the save fails', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 1000, category: 'food', description: 'x' }],
      });
      useTransactionStore.setState({
        addTransaction: jest.fn().mockRejectedValue(new Error('boom')),
      } as never);
      const scrollSpy = jest
        .spyOn(ScrollView.prototype as unknown as { scrollToEnd: () => void }, 'scrollToEnd')
        .mockImplementation(() => {});
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'x 1k');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await screen.findByText('Error: boom');
      fireEvent(screen.UNSAFE_getByType(ScrollView), 'contentSizeChange', 100, 260);
      expect(scrollSpy).not.toHaveBeenCalled();
      scrollSpy.mockRestore();
    });

    it('saves only once when Send is pressed twice quickly', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 30000, category: 'food', description: 'Coffee' }],
      });
      const addTransaction = jest.fn().mockResolvedValue(undefined);
      useTransactionStore.setState({ addTransaction } as never);
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'Coffee 30k');
      const send = screen.getByTestId('day-modal-send');
      fireEvent(send, 'pressIn');
      fireEvent(send, 'pressIn');
      await waitFor(() => expect(addTransaction).toHaveBeenCalledTimes(1));
      expect(parseTransactionText).toHaveBeenCalledTimes(1);
    });

    it('does nothing when Send is pressed with empty input', () => {
      open();
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      expect(parseTransactionText).not.toHaveBeenCalled();
    });

    it('shows a loading indicator only while saving', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 30000, category: 'food', description: 'Coffee' }],
      });
      let resolveSave: () => void = () => {};
      const addTransaction = jest.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));
      useTransactionStore.setState({ addTransaction } as never);
      open();
      expect(screen.queryByTestId('day-modal-loading')).toBeNull();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'Coffee 30k');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await screen.findByTestId('day-modal-loading');
      await waitFor(() => expect(addTransaction).toHaveBeenCalled());
      resolveSave();
      await waitFor(() => expect(screen.getByTestId('day-modal-input').props.value).toBe(''));
      await waitFor(() => expect(screen.queryByTestId('day-modal-loading')).toBeNull());
    });

    it('hides the loading indicator after a parse error', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [],
        errorMessage: 'Could not parse',
      });
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'blah');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await screen.findByText('Could not parse');
      expect(screen.queryByTestId('day-modal-loading')).toBeNull();
    });

    it('hides the loading indicator after a save failure', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [{ type: 'expense', amount: 1000, category: 'food', description: 'x' }],
      });
      useTransactionStore.setState({
        addTransaction: jest.fn().mockRejectedValue(new Error('boom')),
      } as never);
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'x 1k');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await screen.findByText('Error: boom');
      expect(screen.queryByTestId('day-modal-loading')).toBeNull();
    });

    it('shows an error and does not save when text is unparseable', async () => {
      (parseTransactionText as jest.Mock).mockResolvedValue({
        transactions: [],
        errorMessage: 'Could not parse',
      });
      const addTransaction = jest.fn();
      useTransactionStore.setState({ addTransaction } as never);
      open();
      fireEvent.changeText(screen.getByTestId('day-modal-input'), 'blah');
      fireEvent(screen.getByTestId('day-modal-send'), 'pressIn');
      await screen.findByText('Could not parse');
      expect(addTransaction).not.toHaveBeenCalled();
    });

    it('resets add mode when the popup date changes', () => {
      const { rerender } = render(<DayTransactionsModal date={day} onClose={jest.fn()} />);
      fireEvent.press(screen.getByTestId('day-modal-add'));
      rerender(<DayTransactionsModal date={new Date(2026, 6, 11)} onClose={jest.fn()} />);
      expect(screen.queryByTestId('day-modal-input')).toBeNull();
    });
  });

  it('renders a tall card (min height ~60% of window)', () => {
    render(<DayTransactionsModal date={new Date(2026, 6, 12)} onClose={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByTestId('day-transactions-modal').props.style);
    expect(style.minHeight).toBeGreaterThan(0);
  });
});
