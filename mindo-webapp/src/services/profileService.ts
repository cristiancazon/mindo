// Add getDoc to imports
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChildProfile } from '../types';

const PROFILES_COLLECTION = 'profiles';

export const profileService = {
    /**
     * Obtiene todos los perfiles asociados a un padre.
     */
    async getProfiles(parentUid: string): Promise<ChildProfile[]> {
        const q = query(
            collection(db, PROFILES_COLLECTION),
            where('parent_uid', '==', parentUid),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({
            profile_id: docSnap.id,
            ...docSnap.data()
        } as ChildProfile));
    },

    /**
     * Obtiene un perfil específico por su ID.
     */
    async getProfile(profileId: string): Promise<ChildProfile | null> {
        const docRef = doc(db, PROFILES_COLLECTION, profileId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;

        return {
            profile_id: snapshot.id,
            ...snapshot.data()
        } as ChildProfile;
    },

    /**
     * Crea un nuevo perfil. Lanza un error si el padre ya tiene 3.
     */
    async createProfile(parentUid: string, profileData: Omit<ChildProfile, 'profile_id' | 'parent_uid' | 'createdAt'>): Promise<string> {
        // Verificar límite
        const existing = await this.getProfiles(parentUid);
        if (existing.length >= 3) {
            throw new Error('Solo puedes crear un máximo de 3 perfiles por cuenta.');
        }

        const docRef = await addDoc(collection(db, PROFILES_COLLECTION), {
            ...profileData,
            parent_uid: parentUid,
            createdAt: serverTimestamp(),
        });

        return docRef.id;
    },

    /**
     * Actualiza un perfil existente.
     */
    async updateProfile(profileId: string, profileData: Partial<ChildProfile>): Promise<void> {
        const docRef = doc(db, PROFILES_COLLECTION, profileId);
        await updateDoc(docRef, { ...profileData });
    },

    /**
     * Elimina un perfil y todos sus datos asociados.
     */
    async deleteProfile(profileId: string): Promise<void> {
        const docRef = doc(db, PROFILES_COLLECTION, profileId);
        await deleteDoc(docRef);
    },

    /**
     * Añade un nuevo recuerdo (fact) al array de memorias del niño.
     */
    async addMemory(profileId: string, fact: string): Promise<void> {
        const docRef = doc(db, PROFILES_COLLECTION, profileId);
        await updateDoc(docRef, {
            memories: arrayUnion(fact)
        });
    },

    /**
     * Limpia completamente el array de memorias del niño (Reset Context).
     */
    async clearMemories(profileId: string): Promise<void> {
        const docRef = doc(db, PROFILES_COLLECTION, profileId);
        await updateDoc(docRef, {
            memories: []
        });
    }
};
