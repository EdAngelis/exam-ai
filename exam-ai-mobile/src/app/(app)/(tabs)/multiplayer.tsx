import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/atoms/button';
import { Loader } from '@/components/atoms/loader';
import { InlineMessage } from '@/components/molecules/inline-message';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { listGames } from '@/service/game.service';
import type { GameStatus, GameSummary } from '@/types/game';

const STATUS_LABEL: Record<GameStatus, string> = {
  pending: 'Waiting for opponent',
  accepted: 'Ready to start',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function MultiplayerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const email = user?.email?.toLowerCase() ?? '';

  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const list = await listGames();
          if (!cancelled) setGames(list);
        } catch (e) {
          if (!cancelled) {
            setGames([]);
            setError(e instanceof Error ? e.message : 'Could not load games.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const { active, completed } = useMemo(() => {
    const activeGames: GameSummary[] = [];
    const completedGames: GameSummary[] = [];
    for (const game of games) {
      if (game.status === 'completed') completedGames.push(game);
      else activeGames.push(game);
    }
    return { active: activeGames, completed: completedGames };
  }, [games]);

  const inviteCode = user?.gameInviteCode;

  const openLobby = (gameId: string) => {
    router.push({
      pathname: '/game/[gameId]/lobby',
      params: { gameId },
    });
  };

  const openPlay = (gameId: string) => {
    router.push({
      pathname: '/game/[gameId]/play',
      params: { gameId },
    });
  };

  const cardActionTitle = (game: GameSummary): string => {
    const isHost = game.hostEmail === email;
    const isOpponent = game.opponentEmail === email;
    if (game.status === 'pending' && isOpponent) return 'Open invitation';
    if (game.status === 'pending' && isHost) return 'View lobby';
    if (game.status === 'accepted') return 'Open lobby';
    if (game.status === 'in_progress') return 'Continue game';
    return 'View';
  };

  const onCardAction = (game: GameSummary) => {
    if (game.status === 'in_progress') {
      openPlay(game._id);
      return;
    }
    openLobby(game._id);
  };

  const outcomeLabel = (game: GameSummary): string => {
    if (game.winnerUserId === null || game.winnerUserId === undefined) {
      return 'Draw';
    }
    const isHost = game.hostEmail === email;
    const iAmWinner =
      (isHost && game.winnerUserId === game.hostUserId) ||
      (!isHost && game.winnerUserId === game.opponentUserId);
    return iAmWinner ? 'You won' : 'You lost';
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Loader />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <ThemedText type="subtitle">Multi-player</ThemedText>

          {inviteCode && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Your invite code</ThemedText>
              <ThemedText type="title">{inviteCode}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Share this 6-digit code so someone can invite you to a game.
              </ThemedText>
            </ThemedView>
          )}

          <InlineMessage message={error} />

          <ThemedText type="smallBold">Active games</ThemedText>
          {active.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No active games yet. Start one from the Home or History tab.
            </ThemedText>
          ) : (
            active.map((game) => (
              <ThemedView
                key={game._id}
                type="backgroundElement"
                style={styles.card}>
                <ThemedText type="smallBold">
                  {game.hostEmail === email ? game.opponentEmail : game.hostEmail}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {STATUS_LABEL[game.status]}
                  {game.hostEmail === email ? ' · you host' : ' · you are invited'}
                </ThemedText>
                <Button
                  title={cardActionTitle(game)}
                  size="full"
                  onPress={() => onCardAction(game)}
                />
              </ThemedView>
            ))
          )}

          {completed.length > 0 && (
            <>
              <ThemedText type="smallBold" style={styles.historyHeader}>
                Recent games
              </ThemedText>
              {completed.map((game) => {
                const opponent =
                  game.hostEmail === email ? game.opponentEmail : game.hostEmail;
                return (
                  <ThemedView
                    key={game._id}
                    type="backgroundElement"
                    style={styles.card}>
                    <ThemedText type="smallBold">{opponent}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {outcomeLabel(game)} · {game.scores.host}–
                      {game.scores.opponent}
                    </ThemedText>
                    <Button
                      title="View result"
                      size="full"
                      variant="secondary"
                      onPress={() =>
                        router.push({
                          pathname: '/game/[gameId]/result',
                          params: { gameId: game._id },
                        })
                      }
                    />
                  </ThemedView>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  historyHeader: {
    marginTop: Spacing.two,
  },
});
