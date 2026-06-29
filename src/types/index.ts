// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  userText?: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TransactionFilter {
  userId?: string;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface TransactionSyncStatus {
  isOnline: boolean;
  lastSyncTime?: Date;
  pendingTransactions: Transaction[];
}

export interface InvoiceGroup {
  id: string;
  name: string;
  transactions: Transaction[];
  totalAmount: number;
  createdAt: Date;
}

export interface InvoicePreviewState {
  isVisible: boolean;
  invoiceData?: InvoiceGroup;
  previewUrl?: string;
}

export type TransactionType = 'income' | 'expense';
export type FilterType = 'month' | 'year' | 'custom';

export interface AITransaction {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export interface AIParseResult {
  transactions: AITransaction[];
  followUpQuestion?: string;
  rawResponse: string;
}

export interface PendingConfirmation {
  id: string;
  transactions: AITransaction[];
}
