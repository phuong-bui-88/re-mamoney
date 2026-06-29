import { create } from 'zustand';
import { ChatMessage } from '@/types';
import firebaseService from '@services/firebase';
import { useTransactionStore } from '@store/index';
import { askFinancialQuestion } from '@services/aiFinancialQA';

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  subscribe: (userId: string) => () => void;
  sendMessage: (text: string, userId: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
}

function formatTransactionsForQA(): string {
  const transactions = useTransactionStore.getState().transactions;
  if (transactions.length === 0) return 'No transactions recorded yet.';

  return transactions
    .slice(-30)
    .map((t) => {
      const date =
        t.date instanceof Date
          ? t.date.toLocaleDateString('en-GB')
          : 'unknown';
      return `${date} | ${t.description} | ${t.amount} | ${t.category} | ${t.type}`;
    })
    .join('\n');
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,

  subscribe: (userId: string) => {
    const unsubscribe = firebaseService.subscribeToChatMessages(
      userId,
      (msgs) => {
        set({ messages: msgs });
      },
    );
    return unsubscribe;
  },

  addMessage: (msg: ChatMessage) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },

  sendMessage: async (text: string, userId: string) => {
    if (!text.trim()) return;

    set({ isLoading: true });

    const userMsg = await firebaseService.addChatMessage({
      userId,
      role: 'user',
      content: text,
    });
    get().addMessage(userMsg);

    const summary = formatTransactionsForQA();
    const answer = await askFinancialQuestion(text, summary);

    const assistantMsg = await firebaseService.addChatMessage({
      userId,
      role: 'assistant',
      content: answer,
    });
    get().addMessage(assistantMsg);

    set({ isLoading: false });
  },
}));
