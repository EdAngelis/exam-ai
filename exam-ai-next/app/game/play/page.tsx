"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../../components/sessions/header/header";
import Loader from "@/components/elements/loader/loader";
import ErrorToast from "@/components/elements/toast/error";
import { Button } from "@/components";
import {
  getGame,
  getPlayableGame,
  submitGameAnswers,
} from "@/service/game.service";
import { GameSummary, PlayableGame, SubmittedAnswer } from "@/models";
import styles from "./page.module.css";

const RESULT_POLL_INTERVAL_MS = 3000;

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60).toString().padStart(2, "0");
  const ss = (safe % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};

const computeRemainingSeconds = (game: GameSummary): number => {
  if (!game.startedAt) return game.timeLimitSeconds;
  const startMs = new Date(game.startedAt).getTime();
  const endMs = startMs + game.timeLimitSeconds * 1000;
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
};

export default function GamePlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("gameId") || "";

  const [playable, setPlayable] = useState<PlayableGame | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [remaining, setRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitingOpponent, setAwaitingOpponent] = useState(false);
  const autoSubmittedRef = useRef(false);

  const submit = useCallback(
    async ({ auto }: { auto: boolean }) => {
      if (!gameId || !playable || submitting || submitted) return;
      setSubmitting(true);
      setError("");
      try {
        const payload: SubmittedAnswer[] = playable.exam.questions.map(
          (question) => ({
            questionId: question._id,
            answer: answers[question._id] ?? -1,
          }),
        );
        const res = await submitGameAnswers(gameId, payload);
        setSubmitted(true);
        if (res.result) {
          router.replace(`/game/result?gameId=${gameId}`);
        } else {
          setAwaitingOpponent(true);
        }
      } catch (err) {
        if (!auto) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível enviar as respostas.",
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
    [answers, gameId, playable, router, submitted, submitting],
  );

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getPlayableGame(gameId);
        if (cancelled) return;
        setPlayable(data);
        setRemaining(computeRemainingSeconds(data.game));
      } catch (err) {
        if (cancelled) return;
        try {
          const game = await getGame(gameId);
          if (cancelled) return;
          if (game.status === "completed") {
            router.replace(`/game/result?gameId=${gameId}`);
            return;
          }
          setError(
            err instanceof Error ? err.message : "Não foi possível carregar o jogo.",
          );
        } catch {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Não foi possível carregar o jogo.",
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId, router]);

  useEffect(() => {
    if (!playable || submitted || awaitingOpponent) return;
    const tick = () => setRemaining(computeRemainingSeconds(playable.game));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [playable, submitted, awaitingOpponent]);

  useEffect(() => {
    if (
      !playable ||
      submitted ||
      submitting ||
      autoSubmittedRef.current ||
      remaining > 0
    ) {
      return;
    }
    autoSubmittedRef.current = true;
    submit({ auto: true });
  }, [remaining, playable, submitted, submitting, submit]);

  useEffect(() => {
    if (!awaitingOpponent || !gameId) return;
    let cancelled = false;
    const check = async () => {
      try {
        const game = await getGame(gameId);
        if (!cancelled && game.status === "completed") {
          router.replace(`/game/result?gameId=${gameId}`);
        }
      } catch {
        // transient error while waiting; keep polling
      }
    };
    check();
    const interval = setInterval(check, RESULT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [awaitingOpponent, gameId, router]);

  const questions = useMemo(() => playable?.exam.questions ?? [], [playable]);

  if (loading) return <Loader />;

  if (error && !playable) {
    return (
      <div>
        <Header />
        <div className={styles.centered}>
          <ErrorToast message={error} />
          <Button type="button" onClick={() => router.push("/game")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (awaitingOpponent) {
    return (
      <div>
        <Header />
        <div className={styles.centered}>
          <h2>Aguardando oponente</h2>
          <p>
            Suas respostas foram enviadas. Esta tela será atualizada quando o
            outro jogador terminar ou o tempo acabar.
          </p>
          <Loader />
        </div>
      </div>
    );
  }

  const question = questions[index];

  if (!question) {
    return (
      <div>
        <Header />
        <div className={styles.centered}>
          <p>Este jogo não possui questões.</p>
          <Button type="button" onClick={() => router.push("/game")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const options = question.options ?? [];
  const selected = answers[question._id];
  const isLast = index === questions.length - 1;
  const progressPercentage = ((index + 1) / questions.length) * 100;

  const select = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [question._id]: optionIndex }));
  };

  return (
    <div className={styles.fontFamily}>
      <Header />
      <div className={styles.questionContainer}>
        <div className={styles.topRow}>
          <div className={styles.timer}>{formatTime(remaining)}</div>
          <div className={styles.title}>{question.question}</div>
        </div>

        <div className={styles.optionsContainer}>
          {options.map((option) => (
            <div
              key={option.index}
              className={`${styles.option} ${
                selected === option.index ? styles.selected : ""
              }`}
              onClick={() => select(option.index)}
            >
              {option.label}
            </div>
          ))}

          {error && <ErrorToast message={error} />}

          <div className={styles.navigationButtons}>
            <Button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Anterior
            </Button>
            <div>
              <div className={styles.questionNumber}>
                Questão {index + 1} de {questions.length}
              </div>
              <div
                className={styles.progressContainer}
                style={{ "--progress": `${progressPercentage}%` } as React.CSSProperties}
              >
                <div className={styles.progressBar}></div>
              </div>
            </div>
            {isLast ? (
              <Button
                type="submit"
                onClick={() => submit({ auto: false })}
                disabled={submitting}
              >
                Enviar
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Próxima
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
