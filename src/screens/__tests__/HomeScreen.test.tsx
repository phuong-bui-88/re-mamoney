import React from 'react';
import { render, act } from '@testing-library/react-native';
import HomeScreen from '@screens/HomeScreen';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), getParent: () => ({ navigate: jest.fn() }) }),
}));

jest.mock('@components/index', () => ({
  CategoryChart: jest.fn(() => null),
  PeriodFilter: jest.fn(() => null),
  StatisticsCard: jest.fn(() => null),
  FloatingActionButton: jest.fn(() => null),
  MonthlyChart: jest.fn(() => null),
  MonthlyLineChart: jest.fn(() => null),
}));

const mocks = jest.requireMock('@components/index');
const lastProps = (name: string) => {
  const calls = mocks[name].mock.calls;
  return calls[calls.length - 1][0];
};
const renderCount = (name: string): number => mocks[name].mock.calls.length;

beforeEach(() => {
  jest.clearAllMocks();
  (firebaseService.subscribeToTransactions as jest.Mock).mockReturnValue(jest.fn());
  useAuthStore.setState({
    selectedUser: { id: 'u', email: 'a@b.c', createdAt: new Date(), updatedAt: new Date() },
  });
});

describe('HomeScreen chart mode', () => {
  it('shows the bar chart by default with a toggle next to the year', () => {
    render(<HomeScreen />);
    expect(renderCount('MonthlyChart')).toBeGreaterThan(0);
    expect(renderCount('MonthlyLineChart')).toBe(0);
    expect(lastProps('PeriodFilter').chartMode).toBe('bar');
    expect(typeof lastProps('PeriodFilter').onChartModeToggle).toBe('function');
  });

  it('hides the bar chart and shows the line chart after toggling', () => {
    render(<HomeScreen />);
    mocks.MonthlyChart.mockClear();
    act(() => {
      lastProps('PeriodFilter').onChartModeToggle();
    });
    expect(lastProps('PeriodFilter').chartMode).toBe('line');
    expect(renderCount('MonthlyLineChart')).toBeGreaterThan(0);
    expect(renderCount('MonthlyChart')).toBe(0);
  });

  it('goes back to the bar chart on a second toggle', () => {
    render(<HomeScreen />);
    act(() => {
      lastProps('PeriodFilter').onChartModeToggle();
    });
    mocks.MonthlyLineChart.mockClear();
    mocks.MonthlyChart.mockClear();
    act(() => {
      lastProps('PeriodFilter').onChartModeToggle();
    });
    expect(lastProps('PeriodFilter').chartMode).toBe('bar');
    expect(renderCount('MonthlyChart')).toBeGreaterThan(0);
    expect(renderCount('MonthlyLineChart')).toBe(0);
  });

  it('passes the month-select handler to the line chart', () => {
    render(<HomeScreen />);
    act(() => {
      lastProps('PeriodFilter').onChartModeToggle();
    });
    expect(typeof lastProps('MonthlyLineChart').onMonthSelect).toBe('function');
    expect(typeof lastProps('MonthlyLineChart').onInfoPress).toBe('function');
  });
});
