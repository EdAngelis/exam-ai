"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "../../../components/sessions/header/header";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import { Button } from "@/components";
import { getGameResult } from "@/service/game.service";
import { GameResult } from "@/models";
import styles from "./page.module.css";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

const COMPLETION_REASON_LABEL: Record<string, string> = {
  both_submitted: "Ambos os jogadores enviaram suas respostas.",
  time_expired: "O tempo do jogo se esgotou.",
};

export default function GameResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("gameId") || "";
  const { data: session } = useSession();
  const userEmail = (session?.user?.email as string) || "";

  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const fetchOnce = async (): Promise<boolean> => {
      try {
        const data = await getGameResult(gameId);
        if (cancelled) return true;
        setResult(data);
        setError("");
        setLoading(false);
        return true;
      } catch (err) {
        if (cancelled) return false;
        pollsRef.current += 1;
        if (pollsRef.current >= MAX_POLLS) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o resultado.",
          );
          setLoading(false);
        }
        return false;
      }
    };

    (async () => {
      const done = await fetchOnce();
      if (done || cancelled) return;
      interval = setInterval(async () => {
        const finished = await fetchOnce();
        if (finished || cancelled || pollsRef.current >= MAX_POLLS) {
          if (interval) clearInterval(interval);
        }
      }, POLL_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [gameId]);

  if (loading) return <Loader />;

  if (!result) {
    return (
      <div>
        <Header />
        <div className={styles.centered}>
          <ErrorToast message={error || "Resultado ainda não disponível."} />
          <Button type="button" onClick={() => router.push("/game")}>
            Voltar para o multiplayer
          </Button>
        </div>
      </div>
    );
  }

  const iAmHost = result.host.email === userEmail;
  const iAmWinner =
    !result.isDraw &&
    result.winnerUserId !== null &&
    ((iAmHost && result.winnerUserId === result.host.userId) ||
      (!iAmHost && result.winnerUserId === result.opponent.userId));

  const headline = result.isDraw
    ? "Empate"
    : iAmWinner
      ? "Você venceu!"
      : "Você perdeu";

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <h2 className={styles.headline}>{headline}</h2>
        {result.completionReason && (
          <p className={styles.subheadline}>
            {COMPLETION_REASON_LABEL[result.completionReason]}
          </p>
        )}

        <div className={styles.scoreRow}>
          <div
            className={`${styles.scoreCard} ${
              !result.isDraw && result.winnerUserId === result.host.userId
                ? styles.winner
                : ""
            }`}
          >
            {!result.isDraw && result.winnerUserId === result.host.userId && (
              <span className={styles.badge}>Vencedor</span>
            )}
            <p className={styles.playerEmail}>
              {result.host.email}
              {iAmHost ? " (você)" : ""}
            </p>
            <p className={styles.score}>{result.host.score}</p>
          </div>

          <div
            className={`${styles.scoreCard} ${
              !result.isDraw && result.winnerUserId === result.opponent.userId
                ? styles.winner
                : ""
            }`}
          >
            {!result.isDraw &&
              result.winnerUserId === result.opponent.userId && (
                <span className={styles.badge}>Vencedor</span>
              )}
            <p className={styles.playerEmail}>
              {result.opponent.email}
              {!iAmHost ? " (você)" : ""}
            </p>
            <p className={styles.score}>{result.opponent.score}</p>
          </div>
        </div>

        <Button type="button" onClick={() => router.push("/game")}>
          Voltar para o multiplayer
        </Button>
      </div>
    </div>
  );
}
