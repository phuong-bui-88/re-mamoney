import { useTransactionStore } from '@store/index';
import firebaseService from '@services/firebase';

const mockTransaction = (overrides: Partial<ReturnType<typeof useTransactionStore.getState>['allTransactions'][0]> = {}) => ({
  id: 'tx-1',
  userId: 'user-1',
  type: 'expense' as const,
  amount: 50000,
  category: 'food',
  description: 'Lunch',
  date: new Date('2026-07-15T10:00:00'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  useTransactionStore.setState({
    allTransactions: [],
    transactions: [],
    periodStart: null,
    periodEnd: null,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

describe('useTransactionStore', () => {
  describe('setAllTransactions', () => {
    it('stores all transactions and computes period-filtered subset', () => {
      const store = useTransactionStore.getState();
      const start = new Date('2026-07-01');
      const end = new Date('2026-07-31');
      store.setPeriod(start, end);

      const txs = [
        mockTransaction({ id: '1', date: new Date('2026-07-10') }),
        mockTransaction({ id: '2', date: new Date('2026-08-05'), type: 'income', amount: 100000 }),
      ];
      store.setAllTransactions(txs);

      const state = useTransactionStore.getState();
      expect(state.allTransactions).toHaveLength(2);
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].id).toBe('1');
      expect(state.totalExpense).toBe(50000);
      expect(state.totalIncome).toBe(0);
    });

    it('returns empty transactions when no period is set', () => {
      const store = useTransactionStore.getState();
      const txs = [mockTransaction({ id: '1' })];
      store.setAllTransactions(txs);

      const state = useTransactionStore.getState();
      expect(state.allTransactions).toHaveLength(1);
      expect(state.transactions).toHaveLength(0);
    });

    it('handles empty array', () => {
      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));
      store.setAllTransactions([]);

      const state = useTransactionStore.getState();
      expect(state.allTransactions).toHaveLength(0);
      expect(state.transactions).toHaveLength(0);
      expect(state.totalIncome).toBe(0);
      expect(state.totalExpense).toBe(0);
      expect(state.balance).toBe(0);
    });

    it('recalculates totals correctly with mixed types', () => {
      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      store.setAllTransactions([
        mockTransaction({ id: '1', type: 'expense', amount: 30000 }),
        mockTransaction({ id: '2', type: 'income', amount: 200000 }),
        mockTransaction({ id: '3', type: 'expense', amount: 15000 }),
      ]);

      const state = useTransactionStore.getState();
      expect(state.totalIncome).toBe(200000);
      expect(state.totalExpense).toBe(45000);
      expect(state.balance).toBe(155000);
    });
  });

  describe('setPeriod', () => {
    it('filters existing allTransactions by new period', () => {
      const store = useTransactionStore.getState();
      store.setAllTransactions([
        mockTransaction({ id: '1', date: new Date('2026-06-01') }),
        mockTransaction({ id: '2', date: new Date('2026-07-15') }),
        mockTransaction({ id: '3', date: new Date('2026-08-20') }),
      ]);

      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      const state = useTransactionStore.getState();
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].id).toBe('2');
    });

    it('includes transactions on the last day of the month at any time', () => {
      const store = useTransactionStore.getState();
      store.setAllTransactions([
        mockTransaction({ id: '1', date: new Date('2026-07-31T23:59:59') }),
      ]);

      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      const state = useTransactionStore.getState();
      expect(state.transactions).toHaveLength(1);
    });

    it('excludes transactions outside period', () => {
      const store = useTransactionStore.getState();
      store.setAllTransactions([
        mockTransaction({ id: 'before', date: new Date('2026-06-30') }),
        mockTransaction({ id: 'after', date: new Date('2026-08-01') }),
      ]);

      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      const state = useTransactionStore.getState();
      expect(state.transactions).toHaveLength(0);
    });
  });

  describe('addTransaction', () => {
    it('adds new transaction to the store', async () => {
      (firebaseService.addTransaction as jest.Mock).mockResolvedValue(
        mockTransaction({ id: 'new-id' }),
      );

      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      await store.addTransaction({
        userId: 'user-1',
        type: 'expense',
        amount: 75000,
        category: 'transport',
        description: 'Taxi',
        date: new Date('2026-07-20'),
      });

      const state = useTransactionStore.getState();
      expect(state.allTransactions).toHaveLength(1);
      expect(state.allTransactions[0].id).toBe('new-id');
      expect(firebaseService.addTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTransaction', () => {
    it('removes transaction and updates filtered list', async () => {
      (firebaseService.deleteTransaction as jest.Mock).mockResolvedValue(undefined);

      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));
      store.setAllTransactions([
        mockTransaction({ id: 'keep' }),
        mockTransaction({ id: 'remove' }),
      ]);

      await store.deleteTransaction('remove');

      const state = useTransactionStore.getState();
      expect(state.allTransactions).toHaveLength(1);
      expect(state.allTransactions[0].id).toBe('keep');
    });
  });

  describe('transactions computed getters', () => {
    it('balance is income minus expense', () => {
      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));

      store.setAllTransactions([
        mockTransaction({ id: '1', type: 'income', amount: 500000 }),
        mockTransaction({ id: '2', type: 'expense', amount: 200000 }),
      ]);

      const state = useTransactionStore.getState();
      expect(state.balance).toBe(300000);
    });

    it('totals are zero when no transactions exist', () => {
      const store = useTransactionStore.getState();
      store.setPeriod(new Date('2026-07-01'), new Date('2026-07-31'));
      store.setAllTransactions([]);

      const state = useTransactionStore.getState();
      expect(state.totalIncome).toBe(0);
      expect(state.totalExpense).toBe(0);
      expect(state.balance).toBe(0);
    });
  });
});
