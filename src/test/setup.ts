/// <reference types="node" />
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('@services/firebase', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn((callback) => callback(null)),
    addTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    getTransactions: jest.fn(() => Promise.resolve([])),
    subscribeToTransactions: jest.fn(() => jest.fn()),
    addChatMessage: jest.fn(),
    subscribeToChatMessages: jest.fn(),
  },
}));

// Mock AI services
jest.mock('@services/aiTransactionParser', () => ({
  parseTransactionMessage: jest.fn(),
}));

// Mock react-native-gesture-handler (native module)
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: ({ children }: { children: React.ReactNode }) => children,
  gestureHandlerRootHOC: (Component: React.ComponentType) => Component,
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  // Chainable builder: every callback is kept in `handlers` so tests can drive the gesture.
  Gesture: {
    Pan: jest.fn(() => {
      const handlers: Record<string, unknown> = {};
      const gesture: Record<string, unknown> = { handlers };
      ['runOnJS', 'activeOffsetX', 'failOffsetY'].forEach((name) => {
        gesture[name] = () => gesture;
      });
      ['onStart', 'onUpdate', 'onEnd'].forEach((name) => {
        gesture[name] = (callback: unknown) => {
          handlers[name] = callback;
          return gesture;
        };
      });
      return gesture;
    }),
  },
  State: {},
  Directions: {},
}));

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const MockSwipeable = ({ children }: { children: React.ReactNode }) => children;
  return MockSwipeable;
});

// Mock react-native-reanimated (native module)
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRef } = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  const mock = {
    View,
    cancelAnimation: jest.fn(),
    // Shared values keep their identity across renders, as they do in the real library.
    useSharedValue: (init: unknown) => useRef({ value: init }).current,
    useAnimatedStyle: (fn: unknown) => (typeof fn === 'function' ? fn() : {}),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withDecay: (v: unknown) => v,
    withSequence: (v: unknown) => v,
    runOnJS: (fn: unknown) => fn,
    runOnUI: (fn: unknown) => fn,
    createAnimatedComponent: (Component: unknown) => Component,
    Easing: { linear: jest.fn(), ease: jest.fn(), quad: jest.fn(), cubic: jest.fn() },
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    FadeIn: jest.fn(),
    FadeOut: jest.fn(),
    Layout: jest.fn(),
    default: {},
  };
  return mock;
});

// Mock missing native modules
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Ensure DeviceInfo native module returns valid dimensions
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      Dimensions: {
        window: { width: 375, height: 812, scale: 2, fontScale: 1 },
      },
    }),
  },
}));

// Mock expo
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Mock @react-native-vector-icons/ionicons (ESM module, can't be parsed by Jest)
jest.mock('@react-native-vector-icons/ionicons', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: function IoniconsMock({ name }: { name: string }) {
      return React.createElement(Text, null, name);
    },
    Ionicons: function IoniconsMock({ name }: { name: string }) {
      return React.createElement(Text, null, name);
    },
  };
});

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(),
}));

// Suppress console errors in tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
