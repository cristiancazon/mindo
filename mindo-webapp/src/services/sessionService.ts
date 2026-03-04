import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import type { SessionLog } from '../types';

export const saveSessionLog = async (childId: string, log: Omit<SessionLog, 'id' | 'child_id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'profiles', childId, 'sessions'), {
            ...log,
            child_id: childId
        });
        return docRef.id;
    } catch (e) {
        console.error("Error saving session log: ", e);
        throw e;
    }
};

export const getRecentSessions = async (childId: string, maxResults: number = 10): Promise<SessionLog[]> => {
    try {
        const q = query(
            collection(db, 'profiles', childId, 'sessions'),
            orderBy('timestamp', 'desc'),
            limit(maxResults)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SessionLog));
    } catch (e) {
        console.error("Error retrieving sessions: ", e);
        throw e;
    }
};
