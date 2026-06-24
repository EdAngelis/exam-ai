import { Redirect } from 'expo-router';

/**
 * Default landing for the unauthenticated group. Maps to "/" so that when the
 * root guard sends an unauthenticated user here, they deterministically land on
 * sign-in (rather than whichever auth screen happens to be first by filename).
 */
export default function AuthIndex() {
  return <Redirect href="/sign-in" />;
}
