import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, nextUser => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  const value = useMemo(() => ({
    user,
    loading,
    isDemo: Boolean(user?.isAnonymous),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    tryDemo: () => signInAnonymously(auth),
    signOut: () => signOut(auth),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
