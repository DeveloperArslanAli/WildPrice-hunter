/* eslint-disable no-undef */
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getMany: jest.fn(() => Promise.resolve({})),
  setMany: jest.fn(() => Promise.resolve()),
  removeMany: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(() => Promise.resolve('')),
  setString: jest.fn(),
  hasString: jest.fn(() => Promise.resolve(false)),
}));
