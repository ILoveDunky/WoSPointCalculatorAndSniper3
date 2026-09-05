'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile, Tier } from '@/lib/types';
import { TIER_RANK } from '@/lib/types';

const emptyProfile: UserProfile = {
  tier: 'free',
  displayName: null,
  customEvents: {},
  snapshots: [],
  pointsHistory: [],
  updatedAt: 0,
};

interface AuthContextValue {
  cloudEnabled: boolean;
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  redeemCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  saveProfileFields: (fields: Partial<Pick<UserProfile, 'customEvents' | 'snapshots' | 'pointsHistory'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const authInstance = auth;

    const unsub = onAuthStateChanged(authInstance, async (fbUser) => {
      if (!fbUser) {
        try {
          await signInAnonymously(authInstance);
        } catch {
          setLoading(false);
        }
        return;
      }
      setUser(fbUser);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !user) return;

    const ref = doc(db, 'users', user.uid);

    (async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...emptyProfile, displayName: user.displayName, updatedAt: Date.now() });
      }
    })();

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setProfile({ ...emptyProfile, ...(snap.data() as Partial<UserProfile>) });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      if (auth.currentUser?.isAnonymous) {
        await linkWithPopup(auth.currentUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      if (err?.code === 'auth/credential-already-in-use') {
        await signInWithPopup(auth, provider);
      } else {
        throw err;
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const redeemCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!db || !user) {
        return { ok: false, message: 'Cloud sync isn\u2019t set up on this deployment yet, so codes can\u2019t be redeemed here.' };
      }
      if (!code) {
        return { ok: false, message: 'Enter the code from your order first.' };
      }
      try {
        const dbInstance = db;
        const grantedTier: Tier = await runTransaction(dbInstance, async (tx) => {
          const codeRef = doc(dbInstance, 'codes', code);
          const codeSnap = await tx.get(codeRef);
          if (!codeSnap.exists()) {
            throw new Error('That code doesn\u2019t match one we\u2019ve issued \u2014 check for typos.');
          }
          const data = codeSnap.data();
          if (data.used) {
            throw new Error('That code has already been redeemed.');
          }
          const codeTier = (data.tier as Tier) || 'supporter';
          const userRef = doc(dbInstance, 'users', user.uid);
          const userSnap = await tx.get(userRef);
          const currentTier: Tier = (userSnap.data()?.tier as Tier) || 'free';
          // Never downgrade someone who already redeemed a higher tier.
          const nextTier: Tier = TIER_RANK[codeTier] > TIER_RANK[currentTier] ? codeTier : currentTier;
          tx.update(codeRef, { used: true, redeemedBy: user.uid, redeemedAt: serverTimestamp() });
          tx.set(userRef, { tier: nextTier, tierGrantedByCode: code, updatedAt: Date.now() }, { merge: true });
          return nextTier;
        });
        const label = grantedTier === 'officer' ? 'Officer' : 'Supporter';
        return { ok: true, message: `${label} tier unlocked \u2014 thanks for keeping Coldsnap running.` };
      } catch (err: any) {
        return { ok: false, message: err?.message || 'Something went wrong redeeming that code.' };
      }
    },
    [user],
  );

  const saveProfileFields = useCallback(
    async (fields: Partial<Pick<UserProfile, 'customEvents' | 'snapshots' | 'pointsHistory'>>) => {
      if (!db || !user) return;
      await setDoc(doc(db, 'users', user.uid), { ...fields, updatedAt: Date.now() }, { merge: true });
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        cloudEnabled: isFirebaseConfigured,
        user,
        profile,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
        signInWithGoogle,
        signOutUser,
        redeemCode,
        saveProfileFields,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
