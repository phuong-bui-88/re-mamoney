import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import PeriodFilter from '@components/PeriodFilter';

describe('PeriodFilter', () => {
  const defaultProps = {
    year: 2026,
    onYearChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current year', () => {
    render(<PeriodFilter {...defaultProps} />);
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('does not render the month list', () => {
    render(<PeriodFilter {...defaultProps} />);
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].forEach(
      (month) => {
        expect(screen.queryByText(month)).toBeNull();
      }
    );
    expect(screen.queryByTestId('month-scroll')).toBeNull();
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
