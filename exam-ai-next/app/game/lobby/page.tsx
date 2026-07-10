"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "../../../components/sessions/header/header";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import { Button } from "@/components";
import { acceptGame, getGame, startGame } from "@/service/game.service";
import { GameStatus, GameSummary } from "@/models";
import styles from "./page.module.css";

const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<GameStatus, string> = {
  pending: "Aguardando aceite do oponente",
  accepted: "Pronto para iniciar",
  in_progress: "Jogo em andamento",
  completed: "Jogo concluído",
};

export default function GameLobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("gameId") || "";
  const { data: session } = useSession();
  const userEmail = (session?.user?.email as string) || "";

  const [game, setGame] = useState<GameSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");
  const [busy, setBusy] = useState<"accept" | "start" | null>(null);
  const gameRef = useRef<GameSummary | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const next = await getGame(gameId);
        if (cancelled) return;
        gameRef.current = next;
        setGame(next);
        setError("");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar o jogo.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();
    const interval = setInterval(() => {
      const current = gameRef.current;
      if (current && current.status !== "pending" && current.status !== "accepted") {
        return;
      }
      fetchOnce();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [gameId]);

  useEffect(() => {
    if (game?.status === "in_progress" && gameId) {
      router.replace(`/game/play?gameId=${gameId}`);
    }
  }, [game?.status, gameId, router]);

  if (loading) return <Loader />;

  if (!game) {
    return (
      <div>
        <Header />
        <div className={styles.centered}>
          <ErrorToast message={error || "Jogo não encontrado."} />
          <Button type="button" onClick={() => router.push("/game")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isHost = game.hostEmail === userEmail;
  const isOpponent = game.opponentEmail === userEmail;
  const canAccept = isOpponent && game.status === "pending";
  const canStart = isHost && game.status === "accepted";
  const waitingForOpponent = isHost && game.status === "pending";

  const onAccept = async () => {
    setActionError("");
    setBusy("accept");
    try {
      const next = await acceptGame(gameId);
      gameRef.current = next;
      setGame(next);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível aceitar o convite.",
      );
    } finally {
      setBusy(null);
    }
  };

  const onStart = async () => {
    setActionError("");
    setBusy("start");
    try {
      await startGame(gameId);
      router.replace(`/game/play?gameId=${gameId}`);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível iniciar o jogo.",
      );
      setBusy(null);
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <h2 className={styles.title}>Lobby do jogo</h2>

        <div className={styles.card}>
          <strong>Status</strong>
          <p>{STATUS_LABEL[game.status]}</p>
        </div>

        <div className={styles.card}>
          <strong>Anfitrião{isHost ? " (você)" : ""}</strong>
          <p>{game.hostEmail}</p>
          <strong>Oponente{isOpponent ? " (você)" : ""}</strong>
          <p>{game.opponentEmail}</p>
        </div>

        <div className={styles.card}>
          <strong>Tempo limite</strong>
          <p>{Math.round(game.timeLimitSeconds / 60)} minutos</p>
        </div>

        {waitingForOpponent && (
          <p className={styles.hint}>
            Compartilhe este convite com o oponente. Esta tela é atualizada
            automaticamente quando ele aceitar.
          </p>
        )}

        {isOpponent && game.status === "accepted" && (
          <p className={styles.hint}>
            Você aceitou. Aguardando o anfitrião iniciar o jogo.
          </p>
        )}

        {error && <ErrorToast message={error} />}
        {actionError && <ErrorToast message={actionError} />}

        <div className={styles.actions}>
          <Button
            type="button"
            onClick={() => router.push("/game")}
            disabled={busy !== null}
          >
            Voltar
          </Button>
          {canAccept && (
            <Button type="button" onClick={onAccept} disabled={busy !== null}>
              Aceitar convite
            </Button>
          )}
          {canStart && (
            <Button type="button" onClick={onStart} disabled={busy !== null}>
              Iniciar jogo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
