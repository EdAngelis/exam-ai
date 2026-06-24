import { Stack } from 'expo-router';

/**
 * Authenticated area. Modeled as a Stack (dashboard + pushed screens), matching
 * the web app's dashboard-and-header navigation rather than a tab bar. Route
 * protection is handled one level up in the root _layout via <Stack.Protected>.
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Exam-AI' }} />
      <Stack.Screen name="generator" options={{ title: 'Generate questions' }} />
      <Stack.Screen name="exam" options={{ title: 'Exam' }} />
      <Stack.Screen name="student" options={{ title: 'Students' }} />
      <Stack.Screen name="settings" options={{ title: 'Account' }} />
    </Stack>
  );
}
