import { apiClient, type ApiEnvelope } from '@/lib/api-client';
import type { User } from '@/models';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = AuthTokens & {
  user: User;
};

/**
 * Email/password sign-in. Hits POST /auth/mobile/signin, which returns
 * { user, accessToken, refreshToken }. Public (no bearer token yet).
 */
const signInService = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthResult> => {
  const res = await apiClient.post<ApiEnvelope<AuthResult>>(
    'auth/mobile/signin',
    credentials,
    false,
  );
  return res.data;
};

/**
 * Account registration. Hits POST /auth/mobile/signup (wraps the shared
 * createUser controller: hashes the password, sends a verification email).
 * Returns the created user; the user must verify their email before signing in.
 */
const signUpService = async (params: {
  name?: string;
  email: string;
  password: string;
}): Promise<User> => {
  const res = await apiClient.post<ApiEnvelope<User>>(
    'auth/mobile/signup',
    params,
    false,
  );
  return res.data;
};

/**
 * Exchanges a Google ID token (obtained on-device via expo-auth-session) for
 * our own session. The backend verifies the token with google-auth-library and
 * upserts the user. Returns { user, accessToken, refreshToken }.
 */
const signInWithGoogleService = async (
  idToken: string,
): Promise<AuthResult> => {
  const res = await apiClient.post<ApiEnvelope<AuthResult>>(
    'auth/mobile/google',
    { idToken },
    false,
  );
  return res.data;
};

/** Returns the currently authenticated user. Requires a valid access token. */
const getMeService = async (): Promise<User> => {
  const res = await apiClient.get<ApiEnvelope<User>>('auth/mobile/me');
  return res.data;
};

const verifyEmail = async (code: string): Promise<string> => {
  const res = await apiClient.get<ApiEnvelope<unknown>>(
    `auth/mobile/validate-email/${code}`,
    undefined,
    false,
  );
  return res.message;
};

const sendResetPasswordToken = async (email: string): Promise<string> => {
  const res = await apiClient.get<ApiEnvelope<unknown>>(
    `auth/mobile/send-reset-password-token/${email}`,
    undefined,
    false,
  );
  return res.message;
};

const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<string> => {
  const res = await apiClient.post<ApiEnvelope<unknown>>(
    `auth/mobile/reset-password/${token}`,
    { password: newPassword },
    false,
  );
  return res.message;
};

export {
  signInService,
  signUpService,
  signInWithGoogleService,
  getMeService,
  verifyEmail,
  sendResetPasswordToken,
  resetPassword,
};
