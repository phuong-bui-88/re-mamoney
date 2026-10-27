/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable react/display-name */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from '@/App';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: 'navigation-container' }, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Navigator = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: 'stack-navigator' }, children);
  const Screen = ({
    name,
    component: Component,
    children,
  }: {
    name: string;
    component?: React.ComponentType;
    children?: React.ReactNode;
  }) =>
    React.createElement(
      View,
      { testID: `stack-screen-${name}` },
      Component ? React.createElement(Component) : children ?? null,
    );
  return { createNativeStackNavigator: () => ({ Navigator, Screen }) };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Navigator = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(View, { testID: 'tab-navigator' }, children);
  const Screen = ({
    name,
    component: Component,
  }: {
    name: string;
    component: React.ComponentType;
  }) =>
    React.createElement(
      View,
      { testID: `tab-screen-${name}` },
      Component ? React.createElement(Component) : null,
    );
  return { createBottomTabNavigator: () => ({ Navigator, Screen }) };
});

jest.mock('@screens/LoginScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'login-screen' }, 'Login');
});

jest.mock('@screens/HomeScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'home-screen' }, 'Dashboard');
});

jest.mock('@screens/TransactionListScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'transactions-screen' }, 'Transactions');
});

jest.mock('@screens/AskScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'ask-screen' }, 'Ask');
});

jest.mock('@screens/SettingsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'settings-screen' }, 'Settings');
});

jest.mock('@screens/AddTransactionScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'add-transaction-screen' }, 'Add Transaction');
});

jest.mock('@screens/EditTransactionScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, { testID: 'edit-transaction-screen' }, 'Edit Transaction');
});

jest.mock('@services/deviceUsers', () => ({
  getDeviceUsers: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@utils/device', () => ({
  getDeviceId: jest.fn(() => Promise.resolve('device-1')),
}));

describe('App (native-stack migration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, selectedUser: null, savedAccounts: [] });
    (firebaseService.initialize as jest.Mock).mockResolvedValue(undefined);
    (firebaseService.onAuthStateChanged as jest.Mock).mockImplementation((cb) => {
      cb(null);
      return jest.fn();
    });
  });

  it('renders loading indicator while initializing', () => {
    (firebaseService.initialize as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { UNSAFE_getByType } = render(<App />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByTestId('login-screen')).toBeNull();
  });

  it('shows Login screen when user is not authenticated', async () => {
    (firebaseService.onAuthStateChanged as jest.Mock).mockImplementation((cb) => {
      cb(null);
      return jest.fn();
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('login-screen')).toBeTruthy());
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });

  it('shows Main tabs when user is authenticated', async () => {
    const fakeUser = { uid: 'u1', email: 'test@test.com' };
    (firebaseService.onAuthStateChanged as jest.Mock).mockImplementation((cb) => {
      cb(fakeUser);
      return jest.fn();
    });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('home-screen')).toBeTruthy());
    expect(screen.getByTestId('transactions-screen')).toBeTruthy();
    expect(screen.queryByTestId('login-screen')).toBeNull();
  });

  it('does not throw InteractionManager error on mount', async () => {
    const errorSpy = jest.spyOn(console, 'error');
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('login-screen')).toBeTruthy());
    const interactionErrors = errorSpy.mock.calls.filter(
      (args) => String(args[0]).includes('InteractionManager'),
    );
    expect(interactionErrors).toHaveLength(0);
  });
});
