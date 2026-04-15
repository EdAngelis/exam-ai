"use client";
import React, { useState, useEffect, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import Header from "../../components/sessions/header/header";
import { useSearchParams } from "next/navigation";
import { NextPage } from "next";
import { Exam, Question, NextAuthUser } from "../../models";
import { getExam, updateResult } from "../../service/exams.service";
import { regenerateQuestions } from "../../service/questions.service";
import { useRouter } from "next/navigation";
import { calcScore, arrayShuffle } from "../../utils";
import { Button, Radios, TextArea } from "@/components";
import styles from "./page.module.css";

const Page: NextPage = () => {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<number[]>([]);
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [radioValue, setRadioValue] = useState<string>("");
  const [showRegenerate, setShowRegenerate] = useState<boolean>(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const examIdRef = useRef<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const router = useRouter();

  const { data: session } = useSession();

  useEffect(() => {
    const examId = searchParams?.get("examId") || "";
    if (examId) {
      examIdRef.current = examId;
      fetchExam(examIdRef.current);
    }
  }, [searchParams]);

  const fetchExam = async (id: string) => {
    const resultArray = [];
    const checkedArray = [];
    const resp: Exam = await getExam(id);
    if (resp.questions?.length) {
      for (let i = 0; i < resp.questions.length; i++) {
        resultArray.push(-1);
        checkedArray.push(-1);
      }
    }
    const shuffledOptions = resp.questions?.map((question) => {
      return {
        ...question,
        options: arrayShuffle(question.options),
      };
    });
    resp.questions = shuffledOptions;

    if (
      resp.userEmail === session?.user?.email &&
      (session.user as NextAuthUser).level !== 0 &&
      !resp.answers
    ) {
      setShowRegenerate(true);
    }

    setResult(resultArray);
    setExam(resp);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsButtonDisabled(true);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsButtonDisabled(false);
    }
  };

  const handleNext = () => {
    if (exam && currentQuestionIndex < exam.questions!.length - 1) {
      setIsButtonDisabled(true);
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setIsButtonDisabled(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsButtonDisabled(true);
      const resp = await updateResult(examIdRef.current!, result);
      const scores = calcScore(resp.exam);
      setExam(resp.exam);
      setScore(Math.round(scores[scores.length - 1]));
      setSubmitted(true);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const isCorrect = (exam: Exam, questionIndex: number) => {
    if (!exam.answers) return;
    const lastExamResult = exam.answers![exam.answers!.length - 1];
    const optionAnswered = lastExamResult[questionIndex];

    const correctAnswer = exam.questions![questionIndex].answer;
    if (optionAnswered === correctAnswer) return true;
    return false;
  };

  const handleCorrectAnswer = (
    optionIndex: number,
    questionIndex: number,
    exam: Exam
  ) => {
    if (!exam.answers) return;
    const correctAnswer = exam.questions![questionIndex].answer;
    if (submitted && correctAnswer === optionIndex) {
      return true;
    }
    return false;
  };

  const progressPercentage =
    exam && exam.questions && exam.questions.length > 0
      ? ((currentQuestionIndex + 1) / exam.questions.length) * 100
      : 0;

  const handleViewExam = () => {
    router.push(`/exam?examId=${examIdRef.current}`);
    setCurrentQuestionIndex(0);
    setSubmitted(false);
  };

  const handleIncorrectAnswer = (
    optionIndex: number,
    questionIndex: number,
    exam: Exam
  ) => {
    if (!exam.answers) return;
    const lastExamResult = exam.answers![exam.answers!.length - 1];
    const optionAnswered = lastExamResult[questionIndex];

    if (
      submitted &&
      optionAnswered === optionIndex &&
      !isCorrect(exam, questionIndex)
    ) {
      return true;
    }
    return false;
  };

  const handleRegenerate = async () => {
    const arrayOfQuestions: Question[] =
      radioValue === "0"
        ? ([exam?.questions![currentQuestionIndex]] as Question[])
        : (exam?.questions as Question[]);

    try {
      startTransition(async () => {
        const resp = await regenerateQuestions(textAreaValue, arrayOfQuestions);
        if (resp.message === "success") {
          await fetchExam(examIdRef.current!);
          setTextAreaValue("");
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.fontFamily}>
      <Header />
      <>
        {exam ? (
          <div>
            <div className={styles.questionContainer}>
              <div className={styles.topTitleScore}>
                {submitted && (
                  <div
                    className={styles.scoreChart}
                    style={{
                      background: `conic-gradient(from 0deg, #ff6a00, #ee0979 ${
                        score * 3.6
                      }deg, #ddd ${score * 3.6}deg 360deg)`,
                    }}
                  >
                    <div className={styles.scoreInner}>{score}%</div>
                  </div>
                )}
                <div className={styles.title}>
                  {exam.questions![currentQuestionIndex].question}
                </div>
              </div>
              {exam.questions && exam.questions.length > 0 && (
                <div className={styles.optionsContainer}>
                  {exam.questions[currentQuestionIndex].options.map(
                    (option, index) => (
                      <div
                        key={index}
                        className={`
                          ${styles.option}
                          ${
                            result[currentQuestionIndex] === option.index &&
                            !submitted
                              ? styles.selected
                              : ""
                          }
                          ${
                            submitted &&
                            handleCorrectAnswer(
                              option.index,
                              currentQuestionIndex,
                              exam
                            )
                              ? styles.correct
                              : ""
                          }
                          ${
                            submitted &&
                            handleIncorrectAnswer(
                              option.index,
                              currentQuestionIndex,
                              exam
                            )
                              ? styles.incorrect
                              : ""
                          }
                        `}
                        onClick={() => {
                          if (!submitted) {
                            const newResult = [...result];
                            newResult[currentQuestionIndex] = option.index;
                            setResult(newResult);
                          }
                        }}
                      >
                        {option.label}
                      </div>
                    )
                  )}
                  {submitted &&
                    exam.questions[currentQuestionIndex].whenWrong && (
                      <div
                        className={`${styles.feedback} ${
                          isCorrect(exam, currentQuestionIndex)
                            ? styles.pass
                            : styles.fail
                        }`}
                      >
                        <p>
                          {isCorrect(exam, currentQuestionIndex)
                            ? "CORRETO!"
                            : "RESPOSTA ERRADA..."}
                        </p>
                        <p>{exam.questions[currentQuestionIndex].whenWrong}</p>
                      </div>
                    )}
                  {showRegenerate &&
                    (isPending ? (
                      <p>Loading...</p>
                    ) : (
                      <div className={styles.regenerateSession}>
                        <div className={styles.regenerateTopRow}>
                          <Button type="button" onClick={handleRegenerate}>
                            Regenerate
                          </Button>
                          <Radios
                            options={[
                              { label: "nessa questão", value: "0" },
                              { label: "em todas", value: "1" },
                            ]}
                            label={"Aplicar:"}
                            selectedValue={radioValue}
                            name={"radio"}
                            onChange={(e) => {
                              setRadioValue(e.target.value);
                            }}
                          />
                        </div>
                        <TextArea
                          placeholder="Digite sua resposta aqui"
                          value={textAreaValue}
                          onChange={(e) => {
                            setTextAreaValue(e.target.value);
                          }}
                        />
                      </div>
                    ))}

                  <div className={styles.navigationButtons}>
                    <Button
                      type="button"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0 || isButtonDisabled}
                    >
                      Previous
                    </Button>
                    <div>
                      <div className={styles.questionNumber}>
                        Question {currentQuestionIndex + 1} of{" "}
                        {exam.questions!.length}
                      </div>

                      <div
                        className={styles.progress_container}
                        style={
                          {
                            "--progress": `${progressPercentage}%`,
                          } as React.CSSProperties
                        }
                      >
                        <div className={styles.progress_bar}></div>
                      </div>
                    </div>
                    {currentQuestionIndex < exam.questions.length - 1 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isButtonDisabled}
                      >
                        Next
                      </Button>
                    ) : (
                      !submitted && (
                        <Button
                          type="submit"
                          onClick={handleSubmit}
                          disabled={isButtonDisabled}
                        >
                          Submit
                        </Button>
                      )
                    )}
                    {submitted &&
                      currentQuestionIndex === exam.questions.length - 1 && (
                        <Button
                          type="button"
                          onClick={() => router.push("/home")}
                          disabled={isButtonDisabled}
                        >
                          Go to Home
                        </Button>
                      )}

                    {/* {submitted && (
                      <div className={styles.refazer}>
                        <Button type="button" onClick={() => handleViewExam()}>
                          Refazer
                        </Button>
                      </div>
                    )} */}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </>
    </div>
  );
};

export default Page;
