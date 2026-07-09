import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from '@utils/device';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDeviceId', () => {
  it('generates and persists a UUID on first call', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const id = await getDeviceId();

    expect(id).toMatch(/^[0-9a-f-]+$/);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@mamoney_device_id', id);
  });

  it('returns existing UUID on subsequent calls', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid-123');

    const id = await getDeviceId();

    expect(id).toBe('existing-uuid-123');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('returns the same ID when called twice', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const id1 = await getDeviceId();
    const storedId = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedId);

    const id2 = await getDeviceId();
    expect(id2).toBe(storedId);
  });
});
