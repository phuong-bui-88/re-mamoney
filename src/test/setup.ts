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
    subscribeToTransactions: jest.fn(),
    addChatMessage: jest.fn(),
    subscribeToChatMessages: jest.fn(),
  },
}));

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock expo
jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

// Suppress console errors in tests
global.console.error = jest.fn();
global.console.warn = jest.fn();
