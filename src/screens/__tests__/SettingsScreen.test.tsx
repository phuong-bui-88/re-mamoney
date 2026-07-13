import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SettingsScreen from '@screens/SettingsScreen';
import { useAuthStore } from '@store/index';

jest.mock('@services/deviceUsers', () => ({
  removeDeviceUser: jest.fn(),
  saveDeviceUser: jest.fn(),
  getDeviceUsers: jest.fn(() => Promise.resolve([])),
  subscribeToDeviceUsers: jest.fn(() => jest.fn()),
}));

const currentDate = new Date();
const userA = { id: 'uid-a', email: 'a@gmail.com', createdAt: currentDate, updatedAt: currentDate };
const userB = { id: 'uid-b', email: 'b@gmail.com', createdAt: currentDate, updatedAt: currentDate };
const userC = { id: 'uid-c', email: 'c@gmail.com', createdAt: currentDate, updatedAt: currentDate };

const savedAccounts = [
  { deviceId: 'd1', userId: 'uid-a', email: 'a@gmail.com', loggedInAt: currentDate },
  { deviceId: 'd1', userId: 'uid-b', email: 'b@gmail.com', loggedInAt: currentDate },
  { deviceId: 'd1', userId: 'uid-c', email: 'c@gmail.com', loggedInAt: currentDate },
];

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: userA,
    selectedUser: userA,
    savedAccounts,
    isLoading: false,
    error: null,
  });
});

describe('SettingsScreen – device accounts', () => {
  it('renders saved accounts', () => {
    render(<SettingsScreen />);

    expect(screen.getByText(/b@gmail.com/)).toBeTruthy();
    expect(screen.getByText(/c@gmail.com/)).toBeTruthy();
    expect(screen.getAllByText(/a@gmail.com/)).toHaveLength(2);
  });

  it('shows "Current" label without dot for current account', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.queryByText(/⬤/)).toBeNull();
    expect(screen.queryByText(/○/)).toBeNull();
  });

  it('renders non-current accounts without dot', () => {
    render(<SettingsScreen />);

    expect(screen.queryByText(/○/)).toBeNull();
  });

  it('calls switchToAccount when Switch button is tapped', () => {
    const switchToAccount = jest.spyOn(useAuthStore.getState(), 'switchToAccount');
    render(<SettingsScreen />);

    const switchButtons = screen.getAllByText('Switch');
    expect(switchButtons).toHaveLength(2);

    fireEvent.press(switchButtons[0]);

    expect(switchToAccount).toHaveBeenCalledTimes(1);
    expect(switchToAccount).toHaveBeenCalledWith(savedAccounts[1]);
  });

  it('does not show Switch or X for the current account', () => {
    render(<SettingsScreen />);

    expect(screen.queryAllByText('Switch')).toHaveLength(2);
    expect(screen.queryAllByText('X')).toHaveLength(0);
  });

  it('hides the device accounts section when savedAccounts is empty', () => {
    useAuthStore.setState({ savedAccounts: [] });
    render(<SettingsScreen />);

    expect(screen.queryByText('Accounts on this device')).toBeNull();
  });

  it('renders Sign Out button', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Sign Out')).toBeTruthy();
  });
});
