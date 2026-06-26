import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { ChatMessage, Transaction, TransactionFilter, User } from '@/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);
const firestore = firebase.firestore(app);

function toDate(timestamp: unknown): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
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
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async signUp(email: string, password: string): Promise<User> {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    if (!userCredential.user) throw new Error('User creation failed - no user returned');
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return user;
  }

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    if (!userCredential.user) throw new Error('Sign in failed - no user returned');
    const user: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return user;
  }

  async signOut(): Promise<void> {
    await auth.signOut();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth.onAuthStateChanged((firebaseUser) => {
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

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const docRef = await firestore.collection('transactions').add({
      ...transaction,
      date: firebase.firestore.Timestamp.fromDate(transaction.date),
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now(),
    });

    return {
      ...transaction,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    await firestore.collection('transactions').doc(id).update({
      ...updates,
      date: updates.date ? firebase.firestore.Timestamp.fromDate(updates.date) : undefined,
      updatedAt: firebase.firestore.Timestamp.now(),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    await firestore.collection('transactions').doc(id).delete();
  }

  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    let query: firebase.firestore.Query = firestore.collection('transactions');

    if (filter.userId) {
      query = query.where('userId', '==', filter.userId);
    }

    if (filter.type) {
      query = query.where('type', '==', filter.type);
    }

    const querySnapshot = await query.get();

    return querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
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
    let query: firebase.firestore.Query = firestore.collection('transactions');

    if (filter.userId) {
      query = query.where('userId', '==', filter.userId);
    }

    if (filter.type) {
      query = query.where('type', '==', filter.type);
    }

    return query.onSnapshot((querySnapshot) => {
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

  async addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const docRef = await firestore.collection('chatMessages').add({
      ...message,
      timestamp: firebase.firestore.Timestamp.now(),
    });

    return {
      ...message,
      id: docRef.id,
      timestamp: new Date(),
    };
  }

  subscribeToChatMessages(userId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const query = firestore.collection('chatMessages').where('userId', '==', userId);

    return query.onSnapshot((querySnapshot) => {
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
