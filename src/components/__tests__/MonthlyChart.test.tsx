import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Gesture } from 'react-native-gesture-handler';
import MonthlyChart from '@components/MonthlyChart';
import { useTransactionStore } from '@store/index';
import { formatCurrency } from '@utils/currency';

const mockTransaction = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense' as const,
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date('2026-07-15T10:00:00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

jest.mock('react-native-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: function SvgMock({ children }: { children?: React.ReactNode }) {
      return React.createElement(View, null, children);
    },
    Svg: function SvgMock({ children }: { children?: React.ReactNode }) {
      return React.createElement(View, null, children);
    },
    G: function GMock({ onPress, children }: { onPress?: () => void; children?: React.ReactNode }) {
      if (onPress) {
        return React.createElement(TouchableOpacity, { onPress, accessibilityRole: 'button' }, children);
      }
      return React.createElement(View, null, children);
    },
    Rect: function RectMock({
      onPress,
      children,
      x,
      width,
      height,
    }: {
      onPress?: () => void;
      children?: React.ReactNode;
      x?: number;
      width?: number;
      height?: number;
    }) {
      if (onPress) {
        return React.createElement(TouchableOpacity, { onPress, accessibilityRole: 'button' }, children);
      }
      return React.createElement(View, { testID: 'chart-bar', x, width, height }, children);
    },
    Line: function LineMock() {
      return null;
    },
    Text: function TextMock({
      children,
      textAnchor,
    }: {
      children?: React.ReactNode;
      textAnchor?: string;
    }) {
      return React.createElement(Text, { textAnchor }, children);
    },
  };
});

beforeEach(() => {
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

describe('MonthlyChart', () => {
  it('renders title and info icon when onInfoPress is provided', () => {
    render(<MonthlyChart onInfoPress={jest.fn()} />);
    expect(screen.getByText('Monthly Net')).toBeTruthy();
    expect(screen.getByTestId('monthly-chart-info-btn')).toBeTruthy();
  });

  it('shows empty state when no transactions exist in the year', () => {
    render(<MonthlyChart />);
    expect(screen.getByText('No transactions in 2026')).toBeTruthy();
  });

  it('renders a label for all 12 months on the scrolling track', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date('2026-01-15') }),
      ],
    });
    render(<MonthlyChart />);
    Array.from({ length: 12 }, (_, month) => `${month + 1}`).forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  describe('bar layout', () => {
    const SLOT_WIDTH = (Dimensions.get('window').width - 32 - 40 - 36) / 5;
    const TRACK_WIDTH = SLOT_WIDTH * 12;

    const seedEveryMonth = (selectedMonth: number): void => {
      useTransactionStore.setState({
        selectedMonth,
        allTransactions: Array.from({ length: 12 }, (_, month) =>
          mockTransaction({
            id: `tx-${month}`,
            amount: 100000 * (month + 1),
            type: 'income',
            date: new Date(2026, month, 15),
          }),
        ),
      });
    };

    const barPositions = (): { x: number; width: number }[] =>
      screen.getAllByTestId('chart-bar').map((bar) => ({ x: bar.props.x, width: bar.props.width }));

    it('keeps all 12 bars inside the track', () => {
      seedEveryMonth(6);
      render(<MonthlyChart />);
      const bars = barPositions();
      expect(bars.length).toBe(12);
      bars.forEach(({ x, width }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + width).toBeLessThanOrEqual(TRACK_WIDTH);
      });
    });

    it('spaces bars one slot apart', () => {
      seedEveryMonth(6);
      render(<MonthlyChart />);
      const xs = barPositions().map((bar) => bar.x);
      xs.slice(1).forEach((x, i) => {
        expect(x - xs[i]).toBeCloseTo(SLOT_WIDTH);
      });
    });

    it('aligns tap areas with their bars', () => {
      seedEveryMonth(6);
      render(<MonthlyChart />);
      const bars = barPositions();
      const overlays = screen
        .getAllByRole('button')
        .map((overlay) => StyleSheet.flatten(overlay.props.style));
      expect(overlays.length).toBe(12);
      overlays.forEach((style, i) => {
        expect(style.left + style.width / 2).toBeCloseTo(bars[i].x + bars[i].width / 2);
      });
    });
  });

  it('renders y-axis tick labels', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 150000, type: 'income', date: new Date('2026-06-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('20k')).toBeTruthy();
    expect(screen.getByText('100k')).toBeTruthy();
    expect(screen.getByText('160k')).toBeTruthy();
  });

  it('shows amount label above an active bar when tapped', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 120000, type: 'income', date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.queryByText(formatCurrency(120000))).toBeNull();
    const bars = screen.getAllByRole('button');
    expect(bars.length).toBe(12);
    fireEvent.press(bars[4]);
    expect(screen.getByText(formatCurrency(120000))).toBeTruthy();
  });

  it('calls onMonthSelect when a bar is tapped', () => {
    const onSelect = jest.fn();
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart onMonthSelect={onSelect} />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[4]);
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('tapping the same bar toggles the active state', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[4]);
    expect(screen.getByText(formatCurrency(50000))).toBeTruthy();
    fireEvent.press(bars[4]);
    expect(screen.queryByText(formatCurrency(50000))).toBeNull();
  });

  it('shows correct amount for expense (negative net)', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 80000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[4]);
    expect(screen.getByText(formatCurrency(80000))).toBeTruthy();
  });

  it('calls onInfoPress when info icon is pressed', () => {
    const onInfo = jest.fn();
    render(<MonthlyChart onInfoPress={onInfo} />);
    fireEvent.press(screen.getByTestId('monthly-chart-info-btn'));
    expect(onInfo).toHaveBeenCalledTimes(1);
  });

  it('does not call onMonthSelect when toggling the same bar off', () => {
    const onSelect = jest.fn();
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart onMonthSelect={onSelect} />);
    const bars = screen.getAllByRole('button');
    fireEvent.press(bars[4]);
    expect(onSelect).toHaveBeenCalledWith(4);
    expect(onSelect).toHaveBeenCalledTimes(1);
    onSelect.mockClear();
    fireEvent.press(bars[4]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows only the amount above a tapped bar', () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, date: new Date('2026-05-15') }),
      ],
    });
    render(<MonthlyChart />);
    fireEvent.press(screen.getAllByRole('button')[4]);
    expect(screen.getByText(formatCurrency(50000))).toBeTruthy();
    expect(screen.queryByText(/^Month \d+$/)).toBeNull();
  });

  describe('scrolling across months', () => {
    const SLOT_WIDTH = (Dimensions.get('window').width - 32 - 40 - 36) / 5;
    const offsetForMonth = (month: number): number => (2 - month) * SLOT_WIDTH;

    type DragHandlers = {
      onStart: () => void;
      onUpdate: (event: { translationX: number }) => void;
      onEnd: (event: { velocityX: number }, success: boolean) => void;
    };

    const dragHandlers = (): DragHandlers =>
      (Gesture.Pan as jest.Mock).mock.results.at(-1)?.value.handlers as DragHandlers;

    const startDrag = (): void => {
      act(() => {
        dragHandlers().onStart();
      });
    };
    // A negative number of slots drags left, which brings later months to the centre.
    const moveDrag = (slots: number): void => {
      act(() => {
        dragHandlers().onUpdate({ translationX: slots * SLOT_WIDTH });
      });
    };
    const endDrag = (success = true, velocityX = 0): void => {
      act(() => {
        dragHandlers().onEnd({ velocityX }, success);
      });
    };
    const trackOffset = (): number =>
      StyleSheet.flatten(screen.getByTestId('monthly-chart-track').props.style).transform[0]
        .translateX;

    beforeEach(() => {
      useTransactionStore.setState({
        allTransactions: Array.from({ length: 12 }, (_, month) =>
          mockTransaction({
            id: `tx-${month}`,
            amount: 100000 * (month + 1),
            type: 'income',
            date: new Date(2026, month, 15),
          })
        ),
      });
    });

    it('starts with the selected month in the centre', () => {
      render(<MonthlyChart />);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(6));
    });

    it('moves the columns with the finger and activates the centred month', () => {
      render(<MonthlyChart />);
      startDrag();
      moveDrag(-1);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(7));
      expect(screen.getByText(formatCurrency(800000))).toBeTruthy();
      expect(screen.queryByText(formatCurrency(700000))).toBeNull();
    });

    it('selects the final month once, only on release', () => {
      const onSelect = jest.fn();
      render(<MonthlyChart onMonthSelect={onSelect} />);
      startDrag();
      moveDrag(-1);
      moveDrag(-2);
      expect(onSelect).not.toHaveBeenCalled();
      endDrag();
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(8);
    });

    it('snaps a partial drag to the nearest month', () => {
      const onSelect = jest.fn();
      render(<MonthlyChart onMonthSelect={onSelect} />);
      startDrag();
      moveDrag(-1.3);
      endDrag();
      expect(onSelect).toHaveBeenCalledWith(7);
      // The mocked animated style is only re-read on render.
      screen.rerender(<MonthlyChart onMonthSelect={onSelect} />);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(7));
    });

    it('carries a fast fling on to a further month', () => {
      const onSelect = jest.fn();
      render(<MonthlyChart onMonthSelect={onSelect} />);
      startDrag();
      moveDrag(-1);
      endDrag(true, (-2 * SLOT_WIDTH) / 0.12);
      expect(onSelect).toHaveBeenCalledWith(9);
    });

    it.each([
      [0, 1],
      [1, 1],
      [2, 1],
      [9, -1],
      [10, -1],
      [11, -1],
    ])('scrolls the columns from month index %i by %i', (month, step) => {
      useTransactionStore.setState({ selectedMonth: month });
      render(<MonthlyChart />);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(month));
      startDrag();
      moveDrag(-step);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(month + step));
    });

    it('does not select again when released on the selected month', () => {
      const onSelect = jest.fn();
      render(<MonthlyChart onMonthSelect={onSelect} />);
      startDrag();
      moveDrag(-1);
      moveDrag(0);
      endDrag();
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByText(formatCurrency(700000))).toBeTruthy();
    });

    it('stops at January and December', () => {
      render(<MonthlyChart />);
      startDrag();
      moveDrag(100);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(0));
      expect(screen.getByText(formatCurrency(100000))).toBeTruthy();
      moveDrag(-100);
      expect(trackOffset()).toBeCloseTo(offsetForMonth(11));
      expect(screen.getByText(formatCurrency(1200000))).toBeTruthy();
    });

    it('returns to the selected month when the drag is cancelled', () => {
      const onSelect = jest.fn();
      render(<MonthlyChart onMonthSelect={onSelect} />);
      startDrag();
      moveDrag(2);
      endDrag(false);
      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByText(formatCurrency(700000))).toBeTruthy();
      expect(trackOffset()).toBeCloseTo(offsetForMonth(6));
    });

    it('slides the columns when the selected month changes from the store', async () => {
      render(<MonthlyChart />);
      act(() => {
        useTransactionStore.setState({ selectedMonth: 10 });
      });
      await waitFor(() => {
        expect(screen.getByText(formatCurrency(1100000))).toBeTruthy();
      });
      expect(trackOffset()).toBeCloseTo(offsetForMonth(10));
    });

    describe('left axis', () => {
      const seedSmallAndLargeMonths = (): void => {
        useTransactionStore.setState({
          allTransactions: [
            mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date(2026, 6, 15) }),
            mockTransaction({
              id: '2',
              amount: 1000000,
              type: 'income',
              date: new Date(2026, 11, 15),
            }),
          ],
        });
      };

      it('scales to the months on screen', () => {
        seedSmallAndLargeMonths();
        render(<MonthlyChart />);
        expect(screen.getByText('100k')).toBeTruthy();
        expect(screen.queryByText('1.0M')).toBeNull();
      });

      it('changes as the columns scroll', () => {
        seedSmallAndLargeMonths();
        render(<MonthlyChart />);
        startDrag();
        moveDrag(-3);
        expect(screen.getByText('1.0M')).toBeTruthy();
        expect(screen.queryByText('100k')).toBeNull();
      });

      it('keeps columns just off screen inside the plot', () => {
        useTransactionStore.setState({
          allTransactions: [
            mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date(2026, 6, 15) }),
            mockTransaction({
              id: '2',
              amount: 1000000,
              type: 'income',
              date: new Date(2026, 9, 15),
            }),
          ],
        });
        render(<MonthlyChart />);
        const plotHeight = 200 - 22 - 8 - 28;
        screen.getAllByTestId('chart-bar').forEach((bar) => {
          expect(bar.props.height).toBeLessThanOrEqual(plotHeight);
        });
      });

      it('shows a readable scale when the months on screen are empty', () => {
        useTransactionStore.setState({
          allTransactions: [
            mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date(2026, 0, 15) }),
          ],
        });
        render(<MonthlyChart />);
        expect(screen.getByText('5k')).toBeTruthy();
        expect(screen.queryByText('0k')).toBeNull();
      });
    });

    it('shows no amount for a month with no net amount', () => {
      useTransactionStore.setState({
        allTransactions: [
          mockTransaction({ id: '1', amount: 100000, type: 'income', date: new Date(2026, 6, 15) }),
        ],
      });
      render(<MonthlyChart />);
      startDrag();
      moveDrag(2);
      expect(screen.queryByText(formatCurrency(100000))).toBeNull();
      expect(screen.queryByText(formatCurrency(0))).toBeNull();
    });
  });

  it('syncs active bar when selectedMonth changes from store', async () => {
    useTransactionStore.setState({
      allTransactions: [
        mockTransaction({ id: '1', amount: 50000, type: 'income', date: new Date('2026-05-15') }),
        mockTransaction({ id: '2', amount: 100000, type: 'income', date: new Date('2026-07-15') }),
      ],
    });
    render(<MonthlyChart />);
    expect(screen.getByText(formatCurrency(100000))).toBeTruthy();
    useTransactionStore.setState({ selectedMonth: 4 });
    await waitFor(() => {
      expect(screen.getByText(formatCurrency(50000))).toBeTruthy();
    });
  });
});
