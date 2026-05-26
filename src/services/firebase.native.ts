import { ChatMessage, Transaction, TransactionFilter, User } from '@/types';

final _logger = Logger('TransactionListScreen');

// Stub Firebase Service for native platforms (iOS, Android)
// Firebase support for native platforms requires @react-native-firebase packages
// This stub prevents errors and allows app to run in mock mode on native platforms

class FirebaseService {
    private static instance: FirebaseService;
    private initialized: boolean = false;

    private constructor() { }

    static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    async initialize(): Promise<void> {

        _logger.debug('Initializing FirebaseService (stub for native platforms)');
        if (this.initialized) {
            return;
        }
        // Only warn in development mode
        if (__DEV__) {
            console.log('Firebase not configured for native platform. Backend features disabled.');
        }
        this.initialized = true;
    }

    // Auth methods
    async signUp(email: string, password: string): Promise<User> {
        throw new Error('Firebase not available on this platform');
    }

    async signIn(email: string, password: string): Promise<User> {
        throw new Error('Firebase not available on this platform');
    }

    async signOut(): Promise<void> {
        throw new Error('Firebase not available on this platform');
    }

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        // Immediately call callback with null (no user) to unblock initialization
        // This allows the app to proceed in stub mode on native platforms
        setTimeout(() => {
            callback(null);
        }, 0);
        // Return no-op unsubscribe function
        return () => { };
    }

    // Transaction methods
    async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
        throw new Error('Firebase not available on this platform');
    }

    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
        throw new Error('Firebase not available on this platform');
    }

    async deleteTransaction(id: string): Promise<void> {
        throw new Error('Firebase not available on this platform');
    }

    async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
        return [];
    }

    subscribeToTransactions(
        filter: TransactionFilter,
        callback: (transactions: Transaction[]) => void
    ): () => void {
        return () => { };
    }

    // Chat messages
    async addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
        throw new Error('Firebase not available on this platform');
    }

    subscribeToChatMessages(userId: string, callback: (messages: ChatMessage[]) => void): () => void {
        return () => { };
    }
}

export default FirebaseService.getInstance();
