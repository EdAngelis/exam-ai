import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

/**
 * Placeholder for the multiplayer play screen. Filled in by Phase 4 of the
 * Game epic; kept as a stub so the lobby's Start button has a valid route to
 * navigate to under typedRoutes.
 */
export default function GamePlayScreen() {
  const router = useRouter();
  return (
    <ThemedView style={styles.container}>
      <View style={styles.inner}>
        <ThemedText type="subtitle">Game in progress</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          The multiplayer play screen is coming in a later phase of the Game
          epic.
        </ThemedText>
        <Button
          title="Back to multiplayer"
          variant="secondary"
          onPress={() => router.replace('/multiplayer')}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    alignItems: 'center',
  },
});
