import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PeriodFilter from '@components/PeriodFilter';

describe('PeriodFilter', () => {
  const defaultProps = {
    month: 6,
    year: 2026,
    onMonthChange: jest.fn(),
    onYearChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 12 month items', () => {
    render(<PeriodFilter {...defaultProps} />);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m) => {
      expect(screen.getByText(m)).toBeTruthy();
    });
  });

  it('renders the current year', () => {
    render(<PeriodFilter {...defaultProps} />);
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('shows indicator dot on active month', () => {
    render(<PeriodFilter {...defaultProps} month={6} />);
    const dots = screen.getAllByText('•');
    expect(dots.length).toBe(1);
  });

  it('active month has larger font weight', () => {
    render(<PeriodFilter {...defaultProps} month={6} />);
    const jul = screen.getByText('Jul');
    expect(jul.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontWeight: '700' })])
    );
  });

  it('calls onMonthChange with correct index when a pill is pressed', () => {
    const onMonthChange = jest.fn();
    render(<PeriodFilter {...defaultProps} onMonthChange={onMonthChange} />);
    fireEvent.press(screen.getByText('Jul'));
    expect(onMonthChange).toHaveBeenCalledWith(6);
  });

  it('calls onMonthChange with index 0 for January', () => {
    const onMonthChange = jest.fn();
    render(<PeriodFilter {...defaultProps} onMonthChange={onMonthChange} />);
    fireEvent.press(screen.getByText('Jan'));
    expect(onMonthChange).toHaveBeenCalledWith(0);
  });

  it('calls onMonthChange with index 11 for December', () => {
    const onMonthChange = jest.fn();
    render(<PeriodFilter {...defaultProps} onMonthChange={onMonthChange} />);
    fireEvent.press(screen.getByText('Dec'));
    expect(onMonthChange).toHaveBeenCalledWith(11);
  });

  it('does not crash with month 0 (January boundary)', () => {
    render(<PeriodFilter {...defaultProps} month={0} />);
    expect(screen.getByText('Jan')).toBeTruthy();
  });

  it('does not crash with month 11 (December boundary)', () => {
    render(<PeriodFilter {...defaultProps} month={11} />);
    expect(screen.getByText('Dec')).toBeTruthy();
  });

  it('calls onMonthChange when momentum scroll ends at new index', () => {
    const onMonthChange = jest.fn();
    render(<PeriodFilter {...defaultProps} month={3} onMonthChange={onMonthChange} />);
    const scroll = screen.getByTestId('month-scroll');
    fireEvent(scroll, 'onMomentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 6 * 80 } },
    });
    expect(onMonthChange).toHaveBeenCalledWith(6);
  });

  it('does not call onMonthChange when momentum scroll ends at same index', () => {
    const onMonthChange = jest.fn();
    render(<PeriodFilter {...defaultProps} month={6} onMonthChange={onMonthChange} />);
    const scroll = screen.getByTestId('month-scroll');
    fireEvent(scroll, 'onMomentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 6 * 80 } },
    });
    expect(onMonthChange).not.toHaveBeenCalled();
  });

  it('calls onYearChange when a year is selected from the modal', () => {
    const onYearChange = jest.fn();
    render(<PeriodFilter {...defaultProps} onYearChange={onYearChange} />);
    fireEvent.press(screen.getByText('2026'));
    const year2025 = screen.getAllByText('2025');
    expect(year2025.length).toBeGreaterThanOrEqual(1);
    fireEvent.press(year2025[0]);
    expect(onYearChange).toHaveBeenCalledWith(2025);
  });
});
