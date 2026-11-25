import { StyleSheet } from 'react-native';

jest.mock('@utils/device', () => ({
  getDeviceId: jest.fn(async () => 'test-device'),
}));
jest.mock('@services/deviceUsers', () => ({
  saveDeviceUser: jest.fn(),
  getDeviceUsers: jest.fn(async () => []),
  removeDeviceUser: jest.fn(),
  subscribeToDeviceUsers: jest.fn(() => jest.fn()),
}));

import { styles as askStyles } from '@screens/AskScreen';
import { styles as addStyles } from '@screens/AddTransactionScreen';
import { styles as editStyles } from '@screens/EditTransactionScreen';
import { styles as loginStyles } from '@screens/LoginScreen';
import { styles as dayModalStyles } from '@components/DayTransactionsModal';

// iOS Safari auto-zooms on input focus when font-size < 16px.
// Every TextInput style must stay at 16px or larger to keep zoom at 100%.
describe('TextInput font size (no auto-zoom on focus)', () => {
  const cases: Array<[string, unknown]> = [
    ['AskScreen input', askStyles.input],
    ['AddTransactionScreen input', addStyles.input],
    ['EditTransactionScreen input', editStyles.input],
    ['LoginScreen input', loginStyles.input],
    ['DayTransactionsModal input', dayModalStyles.input],
  ];

  it.each(cases)('%s uses fontSize >= 16', (_name, style) => {
    const flat = StyleSheet.flatten(style as object) as { fontSize?: number };
    expect(flat.fontSize).toBeGreaterThanOrEqual(16);
  });
});
