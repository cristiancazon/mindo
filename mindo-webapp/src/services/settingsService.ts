import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ParentSettings } from '../types';

const defaultSettings: ParentSettings = {
    voiceName: 'Puck'
};

export const settingsService = {
    async getSettings(parentUid: string): Promise<ParentSettings> {
        const docRef = doc(db, 'parents', parentUid, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as ParentSettings;
        }
        return defaultSettings;
    },

    async updateSettings(parentUid: string, settings: ParentSettings): Promise<void> {
        const docRef = doc(db, 'parents', parentUid, 'settings', 'general');
        await setDoc(docRef, settings, { merge: true });
    }
};
