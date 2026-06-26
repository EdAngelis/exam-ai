import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';

import { Config } from '@/constants/config';

// Required so the auth popup/redirect can dismiss and return to the app.
WebBrowser.maybeCompleteAuthSession();

type UseGoogleAuthResult = {
  /** Opens the Google sign-in flow. */
  promptAsync: () => void;
  /** False until the auth request is initialized (e.g. client IDs missing). */
  isReady: boolean;
};

/**
 * Drives the on-device Google OAuth flow via expo-auth-session and hands the
 * resulting ID token to `onIdToken`. The caller (auth screen) then passes that
 * token to auth-context.signInWithGoogle, which exchanges it for our session.
 *
 * Note on audiences: the returned ID token's `aud` is whichever platform client
 * ID initiated the flow (web/iOS/Android). The backend verifies the token with
 * `GOOGLE_CLIENT_ID` as the expected audience, so configure that to match the
 * client IDs you ship here (or allow multiple audiences server-side).
 */
export function useGoogleAuth(
  onIdToken: (idToken: string) => void,
): UseGoogleAuthResult {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Config.google.webClientId,
    iosClientId: Config.google.iosClientId,
    androidClientId: Config.google.androidClientId,
  });

  // Keep the latest callback without re-firing the response effect when its
  // identity changes between renders.
  const onIdTokenRef = useRef(onIdToken);
  useEffect(() => {
    onIdTokenRef.current = onIdToken;
  }, [onIdToken]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.params?.id_token ?? response.authentication?.idToken;
      if (idToken) onIdTokenRef.current(idToken);
    }
  }, [response]);

  return {
    promptAsync: () => {
      void promptAsync();
    },
    isReady: !!request,
  };
}
