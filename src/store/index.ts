import { create } from 'zustand';
import { Transaction, User, TransactionFilter, DeviceUser } from '@/types';
import { getMonthStart, getMonthEnd } from '@utils/currency';
import firebaseService from '@services/firebase';
import * as deviceUsersService from '@services/deviceUsers';

function filterByPeriod(
  transactions: Transaction[],
  start?: Date | null,
  end?: Date | null,
): Transaction[] {
  if (!start && !end) return [];
  let filtered = [...transactions];
  if (start) {
    filtered = filtered.filter((t) => t.date >= start);
  }
  if (end) {
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter((t) => t.date <= endOfDay);
  }
  return filtered;
}

function computeTotals(transactions: Transaction[]) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

interface AuthStore {
  user: User | null;
  selectedUser: User | null;
  savedAccounts: DeviceUser[];
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSelectedUser: (user: User | null) => void;
  setSavedAccounts: (accounts: DeviceUser[]) => void;
  switchToAccount: (account: DeviceUser) => void;
  removeDeviceAccount: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  selectedUser: null,
  savedAccounts: [],
  isLoading: false,
  error: null,

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await firebaseService.signUp(email, password);
      set({ user, selectedUser: user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await firebaseService.signIn(email, password);
      set({ user, selectedUser: user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.signOut();
      set({ user: null, selectedUser: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user });
  },

  setSavedAccounts: (accounts: DeviceUser[]) => {
    set({ savedAccounts: accounts });
  },

  switchToAccount: (account: DeviceUser) => {
    const now = new Date();
    const selectedUser: User = {
      id: account.userId,
      email: account.email,
      displayName: account.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set({ selectedUser });
    useTransactionStore.getState().setSelectedMonth(now.getMonth());
    useTransactionStore.getState().setSelectedYear(now.getFullYear());
  },

  removeDeviceAccount: async (userId: string) => {
    try {
      const { savedAccounts } = useAuthStore.getState();
      const account = savedAccounts.find((a) => a.userId === userId);
      if (account) {
        await deviceUsersService.removeDeviceUser(account.deviceId, userId);
        set({ savedAccounts: savedAccounts.filter((a) => a.userId !== userId) });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

interface TransactionStore {
  allTransactions: Transaction[];
  transactions: Transaction[];
  filter: TransactionFilter;
  periodStart: Date | null;
  periodEnd: Date | null;
  isLoading: boolean;
  error: string | null;
  selectedMonth: number;
  selectedYear: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;

  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setAllTransactions: (transactions: Transaction[]) => void;
  setPeriod: (start: Date, end: Date) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setFilter: (filter: TransactionFilter) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadTransactions: (filter: TransactionFilter) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  allTransactions: [],
  transactions: [],
  filter: {},
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  periodStart: getMonthStart(new Date()),
  periodEnd: getMonthEnd(new Date()),
  isLoading: false,
  error: null,
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,

  setAllTransactions: (allTransactions: Transaction[]) => {
    const { periodStart, periodEnd } = get();
    const filtered = filterByPeriod(allTransactions, periodStart, periodEnd);
    const totals = computeTotals(filtered);
    set({ allTransactions, transactions: filtered, ...totals });
  },

  setPeriod: (start: Date, end: Date) => {
    const { allTransactions } = get();
    const filtered = filterByPeriod(allTransactions, start, end);
    const totals = computeTotals(filtered);
    set({ periodStart: start, periodEnd: end, transactions: filtered, ...totals });
  },

  setTransactions: (transactions: Transaction[]) => {
    const totals = computeTotals(transactions);
    set({ transactions, ...totals });
  },

  setFilter: (filter: TransactionFilter) => {
    set({ filter });
  },

  setSelectedMonth: (month: number) => {
    set({ selectedMonth: month });
  },

  setSelectedYear: (year: number) => {
    set({ selectedYear: year });
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const newTransaction = await firebaseService.addTransaction(transaction);
      const { allTransactions } = get();
      const merged = allTransactions.filter(t => t.id !== newTransaction.id);
      get().setAllTransactions([...merged, newTransaction]);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.updateTransaction(id, updates);
      const { allTransactions } = get();
      const updated = allTransactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
      get().setAllTransactions(updated);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteTransaction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.deleteTransaction(id);
      const { allTransactions } = get();
      const filtered = allTransactions.filter((t) => t.id !== id);
      get().setAllTransactions(filtered);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  loadTransactions: async (filter: TransactionFilter) => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await firebaseService.getTransactions(filter);
      const { periodStart, periodEnd } = get();
      const existingMap = new Map(get().allTransactions.map((t) => [t.id, t]));
      for (const tx of transactions) {
        existingMap.set(tx.id, tx);
      }
      const merged = Array.from(existingMap.values());
      const filtered = filterByPeriod(merged, periodStart, periodEnd);
      const totals = computeTotals(filtered);
      set({ allTransactions: merged, transactions: filtered, ...totals, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
