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
import { getGameResult } from '@/service/game.service';
import type { GameResult } from '@/types/game';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

export default function GameResultScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameId } = useLocalSearchParams<{ gameId?: string }>();

  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const data = await getGameResult(gameId);
        if (cancelled) return;
        setResult(data);
        setError(null);
        setLoading(false);
        return true;
      } catch (e) {
        if (cancelled) return false;
        // Poll while the backend is still finalising — the "not ready" branch
        // returns a 400. Give up after a bounded number of retries so we don't
        // spin forever on a genuine error.
        pollsRef.current += 1;
        if (pollsRef.current >= MAX_POLLS) {
          setError(e instanceof Error ? e.message : 'Could not load result.');
          setLoading(false);
        }
        return false;
      }
    };

    (async () => {
      const done = await fetchOnce();
      if (done || cancelled) return;
      const interval = setInterval(async () => {
        const finished = await fetchOnce();
        if (finished || cancelled || pollsRef.current >= MAX_POLLS) {
          clearInterval(interval);
        }
      }, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (loading) return <Loader />;

  if (!result) {
    return (
      <ThemedView style={styles.centered}>
        <InlineMessage message={error ?? 'Result not available yet.'} />
        <Button
          title="Back to multiplayer"
          variant="secondary"
          onPress={() => router.replace('/multiplayer')}
        />
      </ThemedView>
    );
  }

  const email = user?.email?.toLowerCase() ?? '';
  const iAmHost = result.host.email === email;
  const iAmWinner =
    !result.isDraw && result.winnerUserId !== null &&
    ((iAmHost && result.winnerUserId === result.host.userId) ||
      (!iAmHost && result.winnerUserId === result.opponent.userId));

  const headline = result.isDraw
    ? "It's a draw"
    : iAmWinner
      ? 'You won!'
      : 'You lost';

  const subHeadline = result.completionReason === 'time_expired'
    ? 'Time expired.'
    : 'Both players finished.';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <ThemedView type="backgroundElement" style={styles.headline}>
            <ThemedText type="title">{headline}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {subHeadline}
            </ThemedText>
          </ThemedView>

          <ScoreCard
            label={`Host${iAmHost ? ' (you)' : ''}`}
            email={result.host.email}
            score={result.host.score}
            isWinner={
              !result.isDraw && result.winnerUserId === result.host.userId
            }
          />
          <ScoreCard
            label={`Opponent${!iAmHost ? ' (you)' : ''}`}
            email={result.opponent.email}
            score={result.opponent.score}
            isWinner={
              !result.isDraw && result.winnerUserId === result.opponent.userId
            }
          />

          <Button
            title="Back to multiplayer"
            size="full"
            onPress={() => router.replace('/multiplayer')}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function ScoreCard({
  label,
  email,
  score,
  isWinner,
}: {
  label: string;
  email: string;
  score: number;
  isWinner: boolean;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {isWinner && (
          <ThemedText type="smallBold" style={styles.winner}>
            Winner
          </ThemedText>
        )}
      </View>
      <ThemedText>{email}</ThemedText>
      <ThemedText type="title">{score}</ThemedText>
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
  headline: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  winner: {
    color: '#30a46c',
  },
});
