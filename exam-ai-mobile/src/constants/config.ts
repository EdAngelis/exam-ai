/**
 * Centralized runtime configuration, sourced from EXPO_PUBLIC_* environment
 * variables. These are statically inlined into the bundle by the Expo bundler,
 * so they are NOT secret — only put non-sensitive, client-safe values here.
 *
 * See .env.example for the full list and how each value maps to exam-ai-api.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    // Surfaced loudly in dev so a missing .env is obvious rather than a silent
    // 403/404 from the backend later.
    console.warn(`[config] Missing required env var ${name}`);
  }
  return value ?? '';
}

export const Config = {
  apiUrl: required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
  mobileApiKey: required(
    'EXPO_PUBLIC_MOBILE_API_KEY',
    process.env.EXPO_PUBLIC_MOBILE_API_KEY,
  ),
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  },
} as const;
