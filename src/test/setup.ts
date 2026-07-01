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
  State: {},
  Directions: {},
}));

jest.mock('react-native-gesture-handler/Swipeable', () => {
  const MockSwipeable = ({ children }: { children: React.ReactNode }) => children;
  return MockSwipeable;
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

// Suppress console errors in tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
