"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listGames } from "../../../service/game.service";
import { getUser } from "../../../service/user.service";
import { GameSummary } from "../../../models";
import { Button } from "../..";
import styles from "./game_history.module.css";

const STATUS_LABEL: Record<GameSummary["status"], string> = {
  pending: "Aguardando aceite",
  accepted: "Pronto para iniciar",
  in_progress: "Em andamento",
  completed: "Concluído",
};

const opponentEmail = (game: GameSummary, userEmail: string) =>
  game.hostEmail === userEmail ? game.opponentEmail : game.hostEmail;

const cardActionLabel = (game: GameSummary, userEmail: string): string => {
  const isHost = game.hostEmail === userEmail;
  const isOpponent = game.opponentEmail === userEmail;
  if (game.status === "pending" && isOpponent) return "Abrir convite";
  if (game.status === "pending" && isHost) return "Ver lobby";
  if (game.status === "accepted") return "Abrir lobby";
  if (game.status === "in_progress") return "Continuar jogo";
  return "Ver";
};

const outcomeLabel = (game: GameSummary, userEmail: string): string => {
  if (game.winnerUserId === null || game.winnerUserId === undefined) {
    return "Empate";
  }
  const isHost = game.hostEmail === userEmail;
  const iAmWinner =
    (isHost && game.winnerUserId === game.hostUserId) ||
    (!isHost && game.winnerUserId === game.opponentUserId);
  return iAmWinner ? "Você venceu" : "Você perdeu";
};

const GameHistory = ({ userEmail }: { userEmail: string }) => {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [gamesList, user] = await Promise.all([
          listGames(),
          getUser(userEmail),
        ]);
        setGames(gamesList);
        setInviteCode(user?.gameInviteCode || "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  const { active, completed } = useMemo(() => {
    const activeGames: GameSummary[] = [];
    const completedGames: GameSummary[] = [];
    for (const game of games) {
      if (game.status === "completed") completedGames.push(game);
      else activeGames.push(game);
    }
    return { active: activeGames, completed: completedGames };
  }, [games]);

  const onCardAction = (game: GameSummary) => {
    if (game.status === "in_progress") {
      router.push(`/game/play?gameId=${game._id}`);
      return;
    }
    router.push(`/game/lobby?gameId=${game._id}`);
  };

  if (loading) {
    return <div className={styles.gameHistory}>Carregando...</div>;
  }

  return (
    <div className={styles.gameHistory}>
      <h2>Multiplayer</h2>

      {inviteCode && (
        <div className={styles.inviteCard}>
          <p>Seu código de convite:</p>
          <h3>{inviteCode}</h3>
        </div>
      )}

      <h3 className={styles.sectionTitle}>Jogos ativos</h3>
      {active.length === 0 ? (
        <p className={styles.emptyState}>
          Nenhum jogo ativo no momento. Inicie um jogo a partir de um exame.
        </p>
      ) : (
        <div className={styles.gameGrid}>
          {active.map((game) => (
            <div key={game._id} className={styles.gameCard}>
              <div className={styles.cardText}>
                <h3>{opponentEmail(game, userEmail)}</h3>
                <p>
                  {STATUS_LABEL[game.status]}
                  {game.hostEmail === userEmail
                    ? " · você é o anfitrião"
                    : " · você foi convidado"}
                </p>
              </div>
              <Button type="button" onClick={() => onCardAction(game)}>
                {cardActionLabel(game, userEmail)}
              </Button>
            </div>
          ))}
        </div>
      )}

      <h3 className={styles.sectionTitle}>Jogos recentes</h3>
      {completed.length === 0 ? (
        <p className={styles.emptyState}>Nenhum jogo concluído ainda.</p>
      ) : (
        <div className={styles.gameGrid}>
          {completed.map((game) => (
            <div key={game._id} className={styles.gameCard}>
              <div className={styles.cardText}>
                <h3>{opponentEmail(game, userEmail)}</h3>
                <p>
                  {outcomeLabel(game, userEmail)} · {game.scores.host}–
                  {game.scores.opponent}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => router.push(`/game/result?gameId=${game._id}`)}
              >
                Ver resultado
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
