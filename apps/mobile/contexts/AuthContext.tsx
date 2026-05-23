import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChange, signOut as authSignOut, type FirebaseUser } from '@/services/auth';
import { getOrCreateUser } from '@/services/users';
import type { User } from '@guidenav/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    appUser: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          const appUser = await getOrCreateUser(user.uid, user.phoneNumber);
          setState({
            firebaseUser: user,
            appUser,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (e) {
          console.error('Failed to get/create user document:', e);
          setState({
            firebaseUser: user,
            appUser: null,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        setState({
          firebaseUser: null,
          appUser: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
