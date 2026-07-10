"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "../../../components/sessions/header/header";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import SuccessToast from "@/components/elements/toast/success";
import { Button } from "@/components";
import {
  acceptGame,
  getGame,
  startGame,
  updateGameTimeLimit,
} from "@/service/game.service";
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

  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("");
  const [timeLimitError, setTimeLimitError] = useState<string>("");
  const [timeLimitSuccess, setTimeLimitSuccess] = useState<boolean>(false);
  const [savingTimeLimit, setSavingTimeLimit] = useState<boolean>(false);
  const timeLimitInitialized = useRef(false);

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

  useEffect(() => {
    if (game && !timeLimitInitialized.current) {
      setTimeLimitMinutes(String(Math.round(game.timeLimitSeconds / 60)));
      timeLimitInitialized.current = true;
    }
  }, [game]);

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
  const canEditTimeLimit =
    isHost && (game.status === "pending" || game.status === "accepted");

  const onSaveTimeLimit = async () => {
    const minutes = Number(timeLimitMinutes);
    if (!Number.isInteger(minutes) || minutes < 1) {
      setTimeLimitError("Informe um número inteiro de ao menos 1 minuto.");
      return;
    }

    setTimeLimitError("");
    setSavingTimeLimit(true);
    try {
      const next = await updateGameTimeLimit(gameId, minutes * 60);
      gameRef.current = next;
      setGame(next);
      setTimeLimitSuccess(true);
      setTimeout(() => setTimeLimitSuccess(false), 2000);
    } catch (err) {
      setTimeLimitError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o tempo limite.",
      );
    } finally {
      setSavingTimeLimit(false);
    }
  };

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

        {canEditTimeLimit && (
          <div className={styles.card}>
            <strong>Alterar tempo limite</strong>
            <div className={styles.timeLimitRow}>
              <input
                type="number"
                min={1}
                step={1}
                className={styles.timeLimitInput}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                disabled={savingTimeLimit}
              />
              <span>minutos</span>
              <Button
                type="button"
                onClick={onSaveTimeLimit}
                disabled={savingTimeLimit}
              >
                Salvar
              </Button>
            </div>
            {timeLimitError && <ErrorToast message={timeLimitError} />}
            {timeLimitSuccess && (
              <SuccessToast message="Tempo limite atualizado." />
            )}
          </div>
        )}

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
