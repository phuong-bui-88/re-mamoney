import { ChatMessage, Transaction, TransactionFilter, User } from '@/types';

// Import Firebase modules directly (no lazy loading on native)
// This ensures all modules are registered before use
import { initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  initializeAuth,
  getReactNativePersistence,
  setPersistence,
  Persistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  Timestamp,
} from 'firebase/firestore';

// Firebase configuration - should be loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug log to verify config is loaded on native platforms
// eslint-disable-next-line no-console
console.warn('Firebase Config Loaded (Native with Web SDK + AsyncStorage):', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyExists: !!firebaseConfig.apiKey,
});

// Helper function to convert Firestore Timestamp to Date
function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as any).toDate === 'function'
  ) {
    return (timestamp as any).toDate();
  }
  return new Date(timestamp as any);
}

class FirebaseService {
  private static instance: FirebaseService;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private auth: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private firestore: any = null;

  private initialized: boolean = false;

  private constructor() { }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(
      'Initializing FirebaseService with Firebase Web SDK 1 + AsyncStorage (native platform)'
    );

    console.log(firebaseConfig);

    const app = initializeApp(firebaseConfig);

    console.log('Firebase app initialized1:', app.name, app.options.projectId);

    // Initialize auth with custom AsyncStorage persistence
    try {
      this.auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('Auth initialized:', this.auth.app.name);
    } catch (error) {
      console.error('Auth initialization failed3:', error);
    }

    console.log('3')

    this.firestore = getFirestore(app);
    this.initialized = true;
    // eslint-disable-next-line no-console
    console.log('Firebase initialized successfully on native platform');
  }

  // Auth methods
  async signUp(email: string, password: string): Promise<User> {
    if (!this.initialized || !this.auth) {
      throw new Error('Firebase not initialized');
    }

    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    if (!this.initialized || !this.auth) {
      throw new Error('Firebase not initialized');
    }

    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return user;
  }

  async signOut(): Promise<void> {
    if (!this.initialized || !this.auth) {
      throw new Error('Firebase not initialized');
    }

    await signOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!this.initialized || !this.auth) {
      // eslint-disable-next-line no-console
      console.warn('Firebase not initialized for auth state changes');
      return () => { };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return onAuthStateChanged(this.auth, (firebaseUser: any) => {
      if (firebaseUser) {
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // Transaction methods
  async addTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> {
    if (!this.initialized || !this.firestore) {
      throw new Error('Firebase not initialized');
    }

    const docRef = await addDoc(collection(this.firestore, 'transactions'), {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      ...transaction,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<void> {
    if (!this.initialized || !this.firestore) {
      throw new Error('Firebase not initialized');
    }

    const docRef = doc(this.firestore, 'transactions', id);
    await updateDoc(docRef, {
      ...updates,
      date: updates.date ? Timestamp.fromDate(updates.date) : undefined,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.initialized || !this.firestore) {
      throw new Error('Firebase not initialized');
    }

    const docRef = doc(this.firestore, 'transactions', id);
    await deleteDoc(docRef);
  }

  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    if (!this.initialized || !this.firestore) {
      throw new Error('Firebase not initialized');
    }

    const constraints = [];

    if (filter.userId) {
      constraints.push(where('userId', '==', filter.userId));
    }

    if (filter.type) {
      constraints.push(where('type', '==', filter.type));
    }

    const q = query(
      collection(this.firestore, 'transactions'),
      ...constraints
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        ...data,
        id: docSnapshot.id,
        date: toDate(data.date),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Transaction;
    });
  }

  subscribeToTransactions(
    filter: TransactionFilter,
    callback: (transactions: Transaction[]) => void
  ): () => void {
    if (!this.initialized || !this.firestore) {
      // eslint-disable-next-line no-console
      console.warn('Firebase not initialized for transaction subscription');
      return () => { };
    }

    const constraints = [];

    if (filter.userId) {
      constraints.push(where('userId', '==', filter.userId));
    }

    if (filter.type) {
      constraints.push(where('type', '==', filter.type));
    }

    const q = query(
      collection(this.firestore, 'transactions'),
      ...constraints
    );

    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          ...data,
          id: docSnapshot.id,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Transaction;
      });
      callback(transactions);
    });
  }

  // Chat methods
  async addChatMessage(message: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    if (!this.initialized || !this.firestore) {
      throw new Error('Firebase not initialized');
    }

    const docRef = await addDoc(collection(this.firestore, 'chatMessages'), {
      ...message,
      timestamp: Timestamp.now(),
    });

    return {
      ...message,
      id: docRef.id,
    };
  }

  subscribeToChatMessages(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    if (!this.initialized || !this.firestore) {
      // eslint-disable-next-line no-console
      console.warn('Firebase not initialized for chat subscription');
      return () => { };
    }

    const q = query(
      collection(this.firestore, 'chatMessages'),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          ...data,
          id: docSnapshot.id,
          timestamp: toDate(data.timestamp),
        } as ChatMessage;
      });
      callback(messages);
    });
  }
}

export default FirebaseService.getInstance();
