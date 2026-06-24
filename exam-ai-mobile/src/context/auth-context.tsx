import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setAuthFailureHandler } from '@/lib/api-client';
import { tokenStorage } from '@/lib/secure-storage';
import type { User } from '@/models';
import {
  getMeService,
  signInService,
  signInWithGoogleService,
  signUpService,
  type AuthResult,
} from '@/service/auth.service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  /** True for teacher accounts (level !== 0); false for students. */
  isTeacher: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    name?: string;
    email: string;
    password: string;
  }) => Promise<User>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const applyAuthResult = useCallback(async (result: AuthResult) => {
    await tokenStorage.setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Restore session on launch: if we have a stored access token, fetch the
  // current user (the api-client transparently refreshes an expired token).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        const me = await getMeService();
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        await tokenStorage.clear();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The api-client calls this when a request fails auth unrecoverably.
  useEffect(() => {
    setAuthFailureHandler(() => {
      void signOut();
    });
    return () => setAuthFailureHandler(null);
  }, [signOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await signInService({ email, password });
      await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const signUp = useCallback(
    async (params: { name?: string; email: string; password: string }) => {
      // Backend creates an inactive user and emails a verification code; the
      // user must verify before they can sign in, so we do not log them in here.
      return signUpService(params);
    },
    [],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      const result = await signInWithGoogleService(idToken);
      await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      // Match the web app: an absent level is treated as a student (0).
      isTeacher: status === 'authenticated' && (user?.level ?? 0) !== 0,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, status, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
