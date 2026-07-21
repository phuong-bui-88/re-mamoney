import { useAuthStore, useTransactionStore } from '@store/index';
import { DeviceUser } from '@/types';

jest.mock('@services/deviceUsers', () => ({
  removeDeviceUser: jest.fn(),
  saveDeviceUser: jest.fn(),
  getDeviceUsers: jest.fn(() => Promise.resolve([])),
  subscribeToDeviceUsers: jest.fn(() => jest.fn()),
}));

const testUser = { id: 'user-a', email: 'a@example.com', createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    selectedUser: null,
    savedAccounts: [],
    isLoading: false,
    error: null,
  });
  useTransactionStore.setState({
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
  });
  jest.clearAllMocks();
});

describe('useAuthStore – device accounts', () => {
  describe('selectedUser', () => {
    it('defaults to null', () => {
      expect(useAuthStore.getState().selectedUser).toBeNull();
    });

    it('setSelectedUser updates the value', () => {
      useAuthStore.getState().setSelectedUser(testUser);
      expect(useAuthStore.getState().selectedUser).toEqual(testUser);
    });

    it('setSelectedUser can set to null', () => {
      useAuthStore.getState().setSelectedUser(testUser);
      useAuthStore.getState().setSelectedUser(null);
      expect(useAuthStore.getState().selectedUser).toBeNull();
    });
  });

  describe('savedAccounts', () => {
    it('defaults to empty array', () => {
      expect(useAuthStore.getState().savedAccounts).toEqual([]);
    });

    it('setSavedAccounts updates the value', () => {
      const accounts: DeviceUser[] = [
        { deviceId: 'd1', userId: 'u1', email: 'a@a.com', loggedInAt: new Date() },
      ];
      useAuthStore.getState().setSavedAccounts(accounts);
      expect(useAuthStore.getState().savedAccounts).toHaveLength(1);
      expect(useAuthStore.getState().savedAccounts[0].userId).toBe('u1');
    });
  });

  describe('switchToAccount', () => {
    it('sets selectedUser with the account userId and email', () => {
      useAuthStore.getState().switchToAccount({
        deviceId: 'd1',
        userId: 'user-b',
        email: 'b@example.com',
        displayName: 'User B',
        loggedInAt: new Date(),
      });

      const state = useAuthStore.getState();
      expect(state.selectedUser).not.toBeNull();
      expect(state.selectedUser!.id).toBe('user-b');
      expect(state.selectedUser!.email).toBe('b@example.com');
      expect(state.selectedUser!.displayName).toBe('User B');
    });

    it('does not change the firebase auth user', () => {
      useAuthStore.setState({ user: testUser });

      useAuthStore.getState().switchToAccount({
        deviceId: 'd1',
        userId: 'user-b',
        email: 'b@example.com',
        loggedInAt: new Date(),
      });

      expect(useAuthStore.getState().user!.id).toBe('user-a');
    });

    it('works without displayName', () => {
      useAuthStore.getState().switchToAccount({
        deviceId: 'd1',
        userId: 'user-c',
        email: 'c@example.com',
        loggedInAt: new Date(),
      });

      expect(useAuthStore.getState().selectedUser!.id).toBe('user-c');
      expect(useAuthStore.getState().selectedUser!.displayName).toBeUndefined();
    });

    it('resets selectedMonth to the current month', () => {
      useTransactionStore.getState().setSelectedMonth(2);
      useTransactionStore.getState().setSelectedYear(2025);

      useAuthStore.getState().switchToAccount({
        deviceId: 'd1',
        userId: 'user-b',
        email: 'b@example.com',
        loggedInAt: new Date(),
      });

      expect(useTransactionStore.getState().selectedMonth).toBe(new Date().getMonth());
    });

    it('resets selectedYear to the current year', () => {
      useTransactionStore.getState().setSelectedMonth(2);
      useTransactionStore.getState().setSelectedYear(2025);

      useAuthStore.getState().switchToAccount({
        deviceId: 'd1',
        userId: 'user-b',
        email: 'b@example.com',
        loggedInAt: new Date(),
      });

      expect(useTransactionStore.getState().selectedYear).toBe(new Date().getFullYear());
    });
  });

  describe('removeDeviceAccount', () => {
    it('calls deviceUsersService.removeDeviceUser with correct params', async () => {
      const { removeDeviceUser } = jest.requireMock('@services/deviceUsers');
      useAuthStore.setState({
        savedAccounts: [
          { deviceId: 'd1', userId: 'user-a', email: 'a@example.com', loggedInAt: new Date() },
          { deviceId: 'd1', userId: 'user-b', email: 'b@example.com', loggedInAt: new Date() },
        ],
      });

      await useAuthStore.getState().removeDeviceAccount('user-b');

      expect(removeDeviceUser).toHaveBeenCalledWith('d1', 'user-b');
    });

    it('removes the account from savedAccounts', async () => {
      useAuthStore.setState({
        savedAccounts: [
          { deviceId: 'd1', userId: 'user-a', email: 'a@example.com', loggedInAt: new Date() },
          { deviceId: 'd1', userId: 'user-b', email: 'b@example.com', loggedInAt: new Date() },
        ],
      });

      await useAuthStore.getState().removeDeviceAccount('user-b');

      const state = useAuthStore.getState();
      expect(state.savedAccounts).toHaveLength(1);
      expect(state.savedAccounts[0].userId).toBe('user-a');
    });

    it('does nothing when userId is not found in savedAccounts', async () => {
      const { removeDeviceUser } = jest.requireMock('@services/deviceUsers');
      useAuthStore.setState({
        savedAccounts: [
          { deviceId: 'd1', userId: 'user-a', email: 'a@example.com', loggedInAt: new Date() },
        ],
      });

      await useAuthStore.getState().removeDeviceAccount('nonexistent');

      expect(removeDeviceUser).not.toHaveBeenCalled();
      expect(useAuthStore.getState().savedAccounts).toHaveLength(1);
    });
  });

  describe('signIn sets selectedUser', () => {
    it('sets selectedUser to the signed-in user on signIn', async () => {
      const firebaseService = jest.requireMock('@services/firebase').default;
      firebaseService.signIn.mockResolvedValue(testUser);

      await useAuthStore.getState().signIn('a@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(testUser);
      expect(state.selectedUser).toEqual(testUser);
    });

    it('sets selectedUser to the signed-up user on signUp', async () => {
      const firebaseService = jest.requireMock('@services/firebase').default;
      firebaseService.signUp.mockResolvedValue(testUser);

      await useAuthStore.getState().signUp('a@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(testUser);
      expect(state.selectedUser).toEqual(testUser);
    });

    it('clears selectedUser on signOut', async () => {
      const firebaseService = jest.requireMock('@services/firebase').default;
      firebaseService.signOut.mockResolvedValue(undefined);
      useAuthStore.setState({ user: testUser, selectedUser: testUser });

      await useAuthStore.getState().signOut();

      expect(useAuthStore.getState().selectedUser).toBeNull();
    });
  });
});
