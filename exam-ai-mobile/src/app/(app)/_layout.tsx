import { Stack } from 'expo-router';

/**
 * Authenticated area. Modeled as a Stack (dashboard tabs + pushed screens).
 * The dashboard itself is a bottom tab navigator ((tabs) group); generator,
 * exam, student, and settings are pushed full-screen on top of it. Route
 * protection is handled one level up in the root _layout via <Stack.Protected>.
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="generator" options={{ title: 'Generate questions' }} />
      <Stack.Screen name="exam" options={{ title: 'Exam' }} />
      <Stack.Screen name="student" options={{ title: 'Students' }} />
      <Stack.Screen name="assign-exam" options={{ title: 'Assign exam' }} />
      <Stack.Screen name="settings" options={{ title: 'Account' }} />
      <Stack.Screen name="game/new" options={{ title: 'Invite opponent' }} />
      <Stack.Screen
        name="game/[gameId]/lobby"
        options={{ title: 'Game lobby' }}
      />
      <Stack.Screen
        name="game/[gameId]/play"
        options={{ title: 'Play game' }}
      />
    </Stack>
  );
}
