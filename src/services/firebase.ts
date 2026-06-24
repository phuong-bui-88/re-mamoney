import { Platform } from 'react-native';

import { ChatMessage, Transaction, TransactionFilter, User } from '@/types';

// Lazy-loaded Firebase modules (only on web)
let firebaseModules: any = null;

function getFirebaseModules() {
  if (firebaseModules) {
    return firebaseModules;
  }

  if (Platform.OS !== 'web') {
    return null;
  }

  try {
    firebaseModules = {
      initializeApp: require('firebase/app').initializeApp,
      getAuth: require('firebase/auth').getAuth,
      createUserWithEmailAndPassword: require('firebase/auth').createUserWithEmailAndPassword,
      signInWithEmailAndPassword: require('firebase/auth').signInWithEmailAndPassword,
      signOut: require('firebase/auth').signOut,
      onAuthStateChanged: require('firebase/auth').onAuthStateChanged,
      getFirestore: require('firebase/firestore').getFirestore,
      collection: require('firebase/firestore').collection,
      addDoc: require('firebase/firestore').addDoc,
      updateDoc: require('firebase/firestore').updateDoc,
      deleteDoc: require('firebase/firestore').deleteDoc,
      query: require('firebase/firestore').query,
      where: require('firebase/firestore').where,
      getDocs: require('firebase/firestore').getDocs,
      onSnapshot: require('firebase/firestore').onSnapshot,
      doc: require('firebase/firestore').doc,
      getDoc: require('firebase/firestore').getDoc,
      Timestamp: require('firebase/firestore').Timestamp,
      getStorage: require('firebase/storage').getStorage,
      ref: require('firebase/storage').ref,
      uploadBytes: require('firebase/storage').uploadBytes,
      getBytes: require('firebase/storage').getBytes,
    };
    return firebaseModules;
  } catch (error) {
    console.error('Failed to load Firebase modules:', error);
    return null;
  }
}


// Firebase configuration - should be loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Debug log to verify config is loaded (web only)
if (Platform.OS === 'web') {
  console.log('Firebase Config Loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKeyExists: !!firebaseConfig.apiKey,
  });
}

class FirebaseService {
  private static instance: FirebaseService;
  private auth: any = null;
  private firestore: any = null;
  private initialized: boolean = false;

  private constructor() { }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private isAvailable(): boolean {
    return Platform.OS === 'web' && this.initialized;
  }

  async initialize(): Promise<void> {
    console.log('Initializing Firebase Service...');
    if (this.initialized) {

      return;
    }

    console.log('Checking platform for Firebase initialization:', Platform.OS);

    // Skip initialization on non-web platforms
    if (Platform.OS !== 'web') {
      console.warn('Firebase Web SDK not available on this platform. Using stub/mock implementation.');
      this.initialized = true;
      return;
    }

    try {
      const fb = getFirebaseModules();
      if (!fb) {
        throw new Error('Failed to load Firebase modules');
      }

      const app = fb.initializeApp(firebaseConfig);
      this.auth = fb.getAuth(app);
      this.firestore = fb.getFirestore(app);
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  // Auth methods
  async signUp(email: string, password: string): Promise<User> {
    if (!this.isAvailable() || !this.auth) throw new Error('Firebase not available on this platform');

    try {
      const fb = getFirebaseModules();
      if (!fb) throw new Error('Firebase modules not loaded');

      const userCredential = await fb.createUserWithEmailAndPassword(this.auth, email, password);
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
    if (!this.isAvailable() || !this.auth) throw new Error('Firebase not available on this platform');

    try {
      const fb = getFirebaseModules();
      if (!fb) throw new Error('Firebase modules not loaded');

      const userCredential = await fb.signInWithEmailAndPassword(this.auth, email, password);
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
    if (!this.isAvailable() || !this.auth) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    await fb.signOut(this.auth);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!this.isAvailable() || !this.auth) {
      console.warn('Firebase not available, returning no-op unsubscribe function');
      return () => { };
    }

    const fb = getFirebaseModules();
    if (!fb) {
      console.warn('Firebase modules not loaded');
      return () => { };
    }

    return fb.onAuthStateChanged(this.auth, (firebaseUser: any) => {
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
    if (!this.isAvailable() || !this.firestore) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    try {
      const docRef = await fb.addDoc(fb.collection(this.firestore, 'transactions'), {
        ...transaction,
        date: fb.Timestamp.fromDate(transaction.date),
        createdAt: fb.Timestamp.now(),
        updatedAt: fb.Timestamp.now(),
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
    if (!this.isAvailable() || !this.firestore) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    try {
      const docRef = fb.doc(this.firestore, 'transactions', id);
      await fb.updateDoc(docRef, {
        ...updates,
        date: updates.date ? fb.Timestamp.fromDate(updates.date) : undefined,
        updatedAt: fb.Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.isAvailable() || !this.firestore) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    try {
      const docRef = fb.doc(this.firestore, 'transactions', id);
      await fb.deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }

  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    if (!this.isAvailable() || !this.firestore) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    try {
      const constraints = [];

      if (filter.userId) {
        constraints.push(fb.where('userId', '==', filter.userId));
      }

      if (filter.type) {
        constraints.push(fb.where('type', '==', filter.type));
      }

      const q = fb.query(fb.collection(this.firestore, 'transactions'), ...constraints);
      const querySnapshot = await fb.getDocs(q);

      return querySnapshot.docs.map((docSnapshot: any) => {
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
    if (!this.isAvailable() || !this.firestore) {
      console.warn('Firebase not available, returning no-op unsubscribe function');
      return () => { };
    }

    const fb = getFirebaseModules();
    if (!fb) {
      console.warn('Firebase modules not loaded');
      return () => { };
    }

    const constraints = [];

    if (filter.userId) {
      constraints.push(fb.where('userId', '==', filter.userId));
    }

    if (filter.type) {
      constraints.push(fb.where('type', '==', filter.type));
    }

    const q = fb.query(fb.collection(this.firestore, 'transactions'), ...constraints);

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

    return fb.onSnapshot(q, (querySnapshot: any) => {
      const transactions = querySnapshot.docs.map((docSnapshot: any) => {
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
    if (!this.isAvailable() || !this.firestore) throw new Error('Firebase not available on this platform');

    const fb = getFirebaseModules();
    if (!fb) throw new Error('Firebase modules not loaded');

    try {
      const docRef = await fb.addDoc(fb.collection(this.firestore, 'chatMessages'), {
        ...message,
        timestamp: fb.Timestamp.now(),
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
    if (!this.isAvailable() || !this.firestore) {
      console.warn('Firebase not available, returning no-op unsubscribe function');
      return () => { };
    }

    const fb = getFirebaseModules();
    if (!fb) {
      console.warn('Firebase modules not loaded');
      return () => { };
    }

    const q = fb.query(fb.collection(this.firestore, 'chatMessages'), fb.where('userId', '==', userId));

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

    return fb.onSnapshot(q, (querySnapshot: any) => {
      const messages = querySnapshot.docs.map((docSnapshot: any) => {
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
