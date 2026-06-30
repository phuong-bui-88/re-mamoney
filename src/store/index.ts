import { create } from 'zustand';
import { Transaction, User, TransactionFilter } from '@/types';
import firebaseService from '@services/firebase';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await firebaseService.signUp(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await firebaseService.signIn(email, password);
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseService.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },
}));

interface TransactionStore {
  transactions: Transaction[];
  filter: TransactionFilter;
  isLoading: boolean;
  error: string | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;

  setTransactions: (transactions: Transaction[]) => void;
  setFilter: (filter: TransactionFilter) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loadTransactions: (filter: TransactionFilter) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  filter: {},
  isLoading: false,
  error: null,
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,

  setTransactions: (transactions: Transaction[]) => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    set({
      transactions,
      totalIncome,
      totalExpense,
      balance,
    });
  },

  setFilter: (filter: TransactionFilter) => {
    set({ filter });
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const newTransaction = await firebaseService.addTransaction(transaction);
      const { transactions } = get();
      get().setTransactions([...transactions, newTransaction]);
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
      const { transactions } = get();
      const updated = transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
      get().setTransactions(updated);
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
      const { transactions } = get();
      const filtered = transactions.filter((t) => t.id !== id);
      get().setTransactions(filtered);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  loadTransactions: async (filter: TransactionFilter) => {
    set({ isLoading: true, error: null });
    try {
      let transactions = await firebaseService.getTransactions(filter);
      if (filter.startDate) {
        transactions = transactions.filter((t) => t.date >= filter.startDate!);
      }
      if (filter.endDate) {
        const endOfDay = new Date(filter.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        transactions = transactions.filter((t) => t.date <= endOfDay);
      }
      get().setTransactions(transactions);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
