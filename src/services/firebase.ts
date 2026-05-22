import { initializeApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getBytes } from 'firebase/storage';
import { Transaction, User, ChatMessage, TransactionFilter } from '@/types';

// Firebase configuration - should be loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug log to verify config is loaded
if (typeof window !== 'undefined') {
  console.log('Firebase Config Loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKeyExists: !!firebaseConfig.apiKey,
  });
}

class FirebaseService {
  private static instance: FirebaseService;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private initialized: boolean = false;

  private constructor() {}

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

    try {
      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);
      this.firestore = getFirestore(app);
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  // Auth methods
  async signUp(email: string, password: string): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return user;
    } catch (error) {
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    if (!this.auth) throw new Error('Firebase not initialized');

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return user;
    } catch (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.auth) throw new Error('Firebase not initialized');
    await firebaseSignOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!this.auth) throw new Error('Firebase not initialized');

    return onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
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
  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    if (!this.firestore) throw new Error('Firebase not initialized');

    try {
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
    } catch (error) {
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    if (!this.firestore) throw new Error('Firebase not initialized');

    try {
      const docRef = doc(this.firestore, 'transactions', id);
      await updateDoc(docRef, {
        ...updates,
        date: updates.date ? Timestamp.fromDate(updates.date) : undefined,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.firestore) throw new Error('Firebase not initialized');

    try {
      const docRef = doc(this.firestore, 'transactions', id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    if (!this.firestore) throw new Error('Firebase not initialized');

    try {
      const constraints = [];

      if (filter.userId) {
        constraints.push(where('userId', '==', filter.userId));
      }

      if (filter.type) {
        constraints.push(where('type', '==', filter.type));
      }

      const q = query(collection(this.firestore, 'transactions'), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Helper function to convert timestamp to Date
        const toDate = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          // If it's already a Date, return it
          if (timestamp instanceof Date) return timestamp;
          // If it has toDate method (Firestore Timestamp), use it
          if (typeof timestamp.toDate === 'function') return timestamp.toDate();
          // If it's a number (milliseconds), convert to Date
          if (typeof timestamp === 'number') return new Date(timestamp);
          // Otherwise return current date as fallback
          return new Date();
        };

        return {
          id: docSnapshot.id,
          ...data,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Transaction;
      });
    } catch (error) {
      throw error;
    }
  }

  subscribeToTransactions(
    filter: TransactionFilter,
    callback: (transactions: Transaction[]) => void
  ): () => void {
    if (!this.firestore) throw new Error('Firebase not initialized');

    const constraints = [];

    if (filter.userId) {
      constraints.push(where('userId', '==', filter.userId));
    }

    if (filter.type) {
      constraints.push(where('type', '==', filter.type));
    }

    const q = query(collection(this.firestore, 'transactions'), ...constraints);

    // Helper function to convert timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      // If it's already a Date, return it
      if (timestamp instanceof Date) return timestamp;
      // If it has toDate method (Firestore Timestamp), use it
      if (typeof timestamp.toDate === 'function') return timestamp.toDate();
      // If it's a number (milliseconds), convert to Date
      if (typeof timestamp === 'number') return new Date(timestamp);
      // Otherwise return current date as fallback
      return new Date();
    };

    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          date: toDate(data.date),
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Transaction;
      });
      callback(transactions);
    });
  }

  // Chat messages
  async addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    if (!this.firestore) throw new Error('Firebase not initialized');

    try {
      const docRef = await addDoc(collection(this.firestore, 'chatMessages'), {
        ...message,
        timestamp: Timestamp.now(),
      });

      return {
        ...message,
        id: docRef.id,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  subscribeToChatMessages(userId: string, callback: (messages: ChatMessage[]) => void): () => void {
    if (!this.firestore) throw new Error('Firebase not initialized');

    const q = query(collection(this.firestore, 'chatMessages'), where('userId', '==', userId));

    // Helper function to convert timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      // If it's already a Date, return it
      if (timestamp instanceof Date) return timestamp;
      // If it has toDate method (Firestore Timestamp), use it
      if (typeof timestamp.toDate === 'function') return timestamp.toDate();
      // If it's a number (milliseconds), convert to Date
      if (typeof timestamp === 'number') return new Date(timestamp);
      // Otherwise return current date as fallback
      return new Date();
    };

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          timestamp: toDate(data.timestamp),
        } as ChatMessage;
      });
      callback(messages);
    });
  }
}

export default FirebaseService.getInstance();
