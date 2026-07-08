import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Loader } from '@/components/atoms/loader';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { acceptGame, getGame, startGame } from '@/service/game.service';
import type { GameStatus, GameSummary } from '@/types/game';

const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<GameStatus, string> = {
  pending: 'Waiting for opponent to accept',
  accepted: 'Ready to start',
  in_progress: 'Game in progress',
  completed: 'Game completed',
};

export default function GameLobbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();

  const [game, setGame] = useState<GameSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'accept' | 'start' | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!gameId) return;
    cancelledRef.current = false;

    const fetchOnce = async () => {
      try {
        const next = await getGame(gameId);
        if (cancelledRef.current) return;
        setGame(next);
        setError(null);
      } catch (e) {
        if (cancelledRef.current) return;
        setError(e instanceof Error ? e.message : 'Could not load game.');
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    };

    void fetchOnce();
    const interval = setInterval(() => {
      // Stop polling once we've moved out of pending/accepted; the effect will
      // re-mount if the user re-enters the lobby, so no need for smarter logic.
      if (game && game.status !== 'pending' && game.status !== 'accepted') {
        return;
      }
      void fetchOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // If the game is already in progress when we land here (e.g. from an
  // invitation the opponent accepted while we were away), jump to play.
  useEffect(() => {
    if (game?.status === 'in_progress' && gameId) {
      router.replace({
        pathname: '/game/[gameId]/play',
        params: { gameId },
      });
    }
  }, [game?.status, gameId, router]);

  if (loading) return <Loader />;

  if (!game) {
    return (
      <ThemedView style={styles.centered}>
        <InlineMessage message={error ?? 'Game not found.'} />
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const email = user?.email?.toLowerCase() ?? '';
  const isHost = game.hostEmail === email;
  const isOpponent = game.opponentEmail === email;

  const onAccept = async () => {
    if (!gameId) return;
    setActionError(null);
    setBusy('accept');
    try {
      const next = await acceptGame(gameId);
      setGame(next);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not accept game.');
    } finally {
      setBusy(null);
    }
  };

  const onStart = async () => {
    if (!gameId) return;
    setActionError(null);
    setBusy('start');
    try {
      const next = await startGame(gameId);
      setGame(next);
      router.replace({
        pathname: '/game/[gameId]/play',
        params: { gameId },
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not start game.');
    } finally {
      setBusy(null);
    }
  };

  const canAccept = isOpponent && game.status === 'pending';
  const canStart = isHost && game.status === 'accepted';
  const waitingForOpponent = isHost && game.status === 'pending';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <ThemedText type="subtitle">Game lobby</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Status</ThemedText>
            <ThemedText>{STATUS_LABEL[game.status]}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">
              Host{isHost ? ' (you)' : ''}
            </ThemedText>
            <ThemedText>{game.hostEmail}</ThemedText>

            <ThemedText type="smallBold" style={styles.spacer}>
              Opponent{isOpponent ? ' (you)' : ''}
            </ThemedText>
            <ThemedText>{game.opponentEmail}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Time limit</ThemedText>
            <ThemedText>
              {Math.round(game.timeLimitSeconds / 60)} minutes
            </ThemedText>
          </ThemedView>

          {waitingForOpponent && (
            <ThemedText type="small" themeColor="textSecondary">
              Share this invitation with the opponent. This screen updates
              automatically when they accept.
            </ThemedText>
          )}

          {isOpponent && game.status === 'accepted' && (
            <ThemedText type="small" themeColor="textSecondary">
              You accepted. Waiting for the host to start the game.
            </ThemedText>
          )}

          <InlineMessage message={error} />
          <InlineMessage message={actionError} />

          <View style={styles.actions}>
            <Button
              title="Back"
              variant="secondary"
              onPress={() => router.back()}
              disabled={busy !== null}
            />
            {canAccept && (
              <Button
                title="Accept invitation"
                onPress={onAccept}
                loading={busy === 'accept'}
              />
            )}
            {canStart && (
              <Button
                title="Start game"
                onPress={onStart}
                loading={busy === 'start'}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  content: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  spacer: {
    marginTop: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
