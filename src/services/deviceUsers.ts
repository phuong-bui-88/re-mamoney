import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { DeviceUser } from '@/types';

let _firestore: firebase.firestore.Firestore | null = null;

function getDb(): firebase.firestore.Firestore {
  if (!_firestore) {
    _firestore = firebase.firestore();
  }
  return _firestore;
}

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

function docRef(deviceId: string, userId: string): firebase.firestore.DocumentReference {
  return getDb().collection('deviceUsers').doc(`${deviceId}_${userId}`);
}

export async function saveDeviceUser(
  deviceId: string,
  userId: string,
  email: string,
  displayName?: string,
): Promise<void> {
  await docRef(deviceId, userId).set({
    deviceId,
    userId,
    email,
    displayName: displayName || null,
    loggedInAt: firebase.firestore.Timestamp.now(),
  });
}

export async function getDeviceUsers(deviceId: string): Promise<DeviceUser[]> {
  const snapshot = await getDb()
    .collection('deviceUsers')
    .where('deviceId', '==', deviceId)
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      deviceId: data.deviceId,
      userId: data.userId,
      email: data.email,
      displayName: data.displayName || undefined,
      loggedInAt: toDate(data.loggedInAt),
    };
  });
}

export async function removeDeviceUser(
  deviceId: string,
  userId: string,
): Promise<void> {
  await docRef(deviceId, userId).delete();
}

export function subscribeToDeviceUsers(
  deviceId: string,
  callback: (users: DeviceUser[]) => void,
): () => void {
  const query = getDb()
    .collection('deviceUsers')
    .where('deviceId', '==', deviceId);
  return query.onSnapshot((snapshot) => {
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        deviceId: data.deviceId,
        userId: data.userId,
        email: data.email,
        displayName: data.displayName || undefined,
        loggedInAt: toDate(data.loggedInAt),
      };
    });
    callback(users);
  });
}
