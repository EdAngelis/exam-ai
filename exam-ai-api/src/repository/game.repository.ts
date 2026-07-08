import { ObjectId, type WithId } from "mongodb";
import { Exam, Game, Question, ensureCollection } from "../models/index";
import {
  type GameCompletionReason,
  type GameT,
  type SubmittedAnswer,
} from "../models/game.model";
import {
  ensureGameInviteCode,
  fetchUserByEmail,
  fetchUserByGameInviteCode,
} from "./user.repository";

const DEFAULT_TIME_LIMIT_SECONDS = 30 * 60;

export class GameRepositoryError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type CurrentUser = {
  _id: ObjectId;
  email: string;
};

type CreateGameInput = {
  examId?: string;
  inviteeEmail?: string;
  inviteeCode?: string;
  timeLimitSeconds?: number;
};

type ExamDocument = {
  _id: ObjectId;
  userEmail?: string;
  userId?: string;
  student?: string;
  students?: string[];
  category?: string;
  subCategory?: string;
  subject?: string;
  questionsId?: Array<ObjectId | string>;
  duration?: number;
};

type QuestionDocument = {
  _id: ObjectId;
  question?: string;
  answer: number;
  whenWrong?: string;
  options?: { label: string; index: number }[];
  [key: string]: unknown;
};

type SubmittedAnswerInput = number | SubmittedAnswer;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getGames = () => {
  ensureCollection<GameT>(Game);
  return Game;
};

const getExams = () => {
  ensureCollection(Exam);
  return Exam;
};

const getQuestions = () => {
  ensureCollection(Question);
  return Question;
};

const toObjectId = (id: string, label: string) => {
  if (!ObjectId.isValid(id)) {
    throw new GameRepositoryError(400, `${label} is invalid`);
  }

  return new ObjectId(id);
};

const userId = (user: CurrentUser) => user._id.toString();

const isParticipant = (game: WithId<GameT>, user: CurrentUser) =>
  game.hostUserId === userId(user) || game.opponentUserId === userId(user);

const assertParticipant = (game: WithId<GameT>, user: CurrentUser) => {
  if (!isParticipant(game, user)) {
    throw new GameRepositoryError(403, "Only game participants can access this game");
  }
};

const loadExam = async (examId: ObjectId): Promise<ExamDocument> => {
  const exam = (await getExams().findOne({ _id: examId })) as ExamDocument | null;
  if (!exam) {
    throw new GameRepositoryError(404, "Exam not found");
  }

  return exam;
};

const canAccessExam = (exam: ExamDocument, user: CurrentUser) => {
  const email = normalizeEmail(user.email);
  const userIdValue = userId(user);
  const examUserEmail = exam.userEmail ? normalizeEmail(exam.userEmail) : "";
  const examStudent = exam.student ? normalizeEmail(exam.student) : "";
  const examStudents = Array.isArray(exam.students)
    ? exam.students.map((studentEmail: string) => normalizeEmail(studentEmail))
    : [];

  return (
    examUserEmail === email ||
    exam.userId === userIdValue ||
    examStudent === email ||
    examStudents.includes(email)
  );
};

const getTimeLimitSeconds = (exam: ExamDocument, requested?: number) => {
  if (exam.duration && exam.duration > 0) {
    return Math.floor(exam.duration * 60);
  }

  if (requested && requested > 0) {
    return Math.floor(requested);
  }

  return DEFAULT_TIME_LIMIT_SECONDS;
};

const loadQuestionsForExam = async (exam: ExamDocument) => {
  const questionIds = (exam.questionsId || []).map((id) =>
    typeof id === "string" ? new ObjectId(id) : id
  );
  const questions = (await getQuestions()
    .find({ _id: { $in: questionIds } })
    .toArray()) as QuestionDocument[];
  const byId = new Map(
    questions.map((question) => [question._id.toString(), question])
  );

  return questionIds
    .map((id: ObjectId) => byId.get(id.toString()))
    .filter((question): question is QuestionDocument => Boolean(question));
};

const stripAnswerKeys = (question: QuestionDocument) => {
  const { answer, whenWrong, ...playableQuestion } = question;
  return playableQuestion;
};

const normalizeAnswers = (
  questions: QuestionDocument[],
  answers: SubmittedAnswerInput[]
): SubmittedAnswer[] => {
  return answers.map((answer, index) => {
    if (typeof answer === "number") {
      return {
        questionId: questions[index]?._id.toString() || "",
        answer,
      };
    }

    return answer;
  });
};

const scoreAnswers = (questions: QuestionDocument[], answers: SubmittedAnswer[]) => {
  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.answer])
  );

  return questions.reduce((score, question) => {
    return question.answer === answerByQuestionId.get(question._id.toString())
      ? score + 1
      : score;
  }, 0);
};

const scoreForUser = (game: WithId<GameT>, participantUserId: string) =>
  game.submissions?.find((submission) => submission.userId === participantUserId)
    ?.score || 0;

const buildResult = (game: WithId<GameT>) => {
  const hostScore = scoreForUser(game, game.hostUserId);
  const opponentScore = scoreForUser(game, game.opponentUserId);
  const winnerUserId =
    hostScore > opponentScore
      ? game.hostUserId
      : opponentScore > hostScore
        ? game.opponentUserId
        : null;

  return {
    gameId: game._id,
    status: game.status,
    completionReason: game.completionReason,
    completedAt: game.completedAt,
    winnerUserId,
    isDraw: winnerUserId === null,
    host: {
      userId: game.hostUserId,
      email: game.hostEmail,
      score: hostScore,
    },
    opponent: {
      userId: game.opponentUserId,
      email: game.opponentEmail,
      score: opponentScore,
    },
  };
};

const summarizeGame = (game: WithId<GameT>) => ({
  _id: game._id,
  hostUserId: game.hostUserId,
  hostEmail: game.hostEmail,
  opponentUserId: game.opponentUserId,
  opponentEmail: game.opponentEmail,
  examId: game.examId,
  status: game.status,
  timeLimitSeconds: game.timeLimitSeconds,
  winnerUserId: game.winnerUserId,
  completionReason: game.completionReason,
  acceptedAt: game.acceptedAt,
  startedAt: game.startedAt,
  completedAt: game.completedAt,
  created_at: game.created_at,
  updated_at: game.updated_at,
  scores: {
    host: scoreForUser(game, game.hostUserId),
    opponent: scoreForUser(game, game.opponentUserId),
  },
});

const completeGame = async (
  game: WithId<GameT>,
  completionReason: GameCompletionReason
) => {
  const result = buildResult({
    ...game,
    status: "completed",
    completionReason,
    completedAt: game.completedAt || new Date(),
  });

  const updatedGame = await getGames().findOneAndUpdate(
    { _id: game._id },
    {
      $set: {
        status: "completed",
        completionReason,
        completedAt: result.completedAt,
        winnerUserId: result.winnerUserId,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updatedGame || game;
};

const finalizeExpiredGame = async (game: WithId<GameT>) => {
  if (game.status !== "in_progress" || !game.startedAt) {
    return game;
  }

  const expiresAt = game.startedAt.getTime() + game.timeLimitSeconds * 1000;
  if (Date.now() < expiresAt) {
    return game;
  }

  return completeGame(game, "time_expired");
};

const finalizeIfBothSubmitted = async (game: WithId<GameT>) => {
  const submittedUserIds = new Set(
    game.submissions?.map((submission) => submission.userId) || []
  );

  if (
    submittedUserIds.has(game.hostUserId) &&
    submittedUserIds.has(game.opponentUserId)
  ) {
    return completeGame(game, "both_submitted");
  }

  return game;
};

const findGameForUser = async (id: string, user: CurrentUser) => {
  const game = await getGames().findOne({ _id: toObjectId(id, "Game id") });
  if (!game) {
    throw new GameRepositoryError(404, "Game not found");
  }

  assertParticipant(game, user);
  return finalizeExpiredGame(game);
};

const createGame = async (host: CurrentUser, input: CreateGameInput) => {
  const hasEmail = Boolean(input.inviteeEmail);
  const hasCode = Boolean(input.inviteeCode);
  if (hasEmail === hasCode) {
    throw new GameRepositoryError(
      400,
      "Provide exactly one inviteeEmail or inviteeCode"
    );
  }

  if (!input.examId) {
    throw new GameRepositoryError(400, "examId is required");
  }

  const exam = await loadExam(toObjectId(input.examId, "Exam id"));
  if (!canAccessExam(exam, host)) {
    throw new GameRepositoryError(403, "User cannot create a game for this exam");
  }

  const invitee = hasEmail
    ? await fetchUserByEmail(normalizeEmail(input.inviteeEmail || ""))
    : await fetchUserByGameInviteCode(input.inviteeCode || "");

  if (!invitee?._id || !invitee.email) {
    throw new GameRepositoryError(404, "Invitee not found");
  }

  if (invitee._id.toString() === userId(host)) {
    throw new GameRepositoryError(400, "Users cannot invite themselves");
  }

  const game: GameT = {
    hostUserId: userId(host),
    hostEmail: normalizeEmail(host.email),
    opponentUserId: invitee._id.toString(),
    opponentEmail: normalizeEmail(invitee.email),
    examId: exam._id,
    status: "pending",
    timeLimitSeconds: getTimeLimitSeconds(exam, input.timeLimitSeconds),
    submissions: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const result = await getGames().insertOne(game);
  const createdGame = await getGames().findOne({ _id: result.insertedId });
  return createdGame ? summarizeGame(createdGame) : null;
};

const listGames = async (user: CurrentUser) => {
  const games = await getGames()
    .find({
      $or: [{ hostUserId: userId(user) }, { opponentUserId: userId(user) }],
    })
    .sort({ updated_at: -1, created_at: -1 })
    .toArray();

  const finalizedGames = await Promise.all(games.map(finalizeExpiredGame));
  return finalizedGames.map(summarizeGame);
};

const getGame = async (id: string, user: CurrentUser) =>
  summarizeGame(await findGameForUser(id, user));

const acceptGame = async (id: string, user: CurrentUser) => {
  const game = await findGameForUser(id, user);
  if (game.opponentUserId !== userId(user)) {
    throw new GameRepositoryError(403, "Only the invited opponent can accept");
  }

  if (game.status !== "pending") {
    throw new GameRepositoryError(400, "Only pending games can be accepted");
  }

  const updatedGame = await getGames().findOneAndUpdate(
    { _id: game._id },
    {
      $set: {
        status: "accepted",
        acceptedAt: new Date(),
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updatedGame ? summarizeGame(updatedGame) : null;
};

const startGame = async (id: string, user: CurrentUser) => {
  const game = await findGameForUser(id, user);
  if (game.hostUserId !== userId(user)) {
    throw new GameRepositoryError(403, "Only the host can start the game");
  }

  if (game.status !== "accepted") {
    throw new GameRepositoryError(400, "Only accepted games can be started");
  }

  const updatedGame = await getGames().findOneAndUpdate(
    { _id: game._id },
    {
      $set: {
        status: "in_progress",
        startedAt: new Date(),
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updatedGame ? summarizeGame(updatedGame) : null;
};

const getPlayableGame = async (id: string, user: CurrentUser) => {
  const game = await findGameForUser(id, user);
  if (game.status !== "in_progress") {
    throw new GameRepositoryError(400, "Game is not in progress");
  }

  const exam = await loadExam(game.examId);
  const questions = await loadQuestionsForExam(exam);

  return {
    game: summarizeGame(game),
    exam: {
      _id: exam._id,
      category: exam.category,
      subCategory: exam.subCategory,
      subject: exam.subject,
      duration: exam.duration,
      timeLimitSeconds: game.timeLimitSeconds,
      questions: questions.map(stripAnswerKeys),
    },
  };
};

const submitAnswers = async (
  id: string,
  user: CurrentUser,
  answers: SubmittedAnswerInput[]
) => {
  let game = await findGameForUser(id, user);
  if (game.status !== "in_progress") {
    throw new GameRepositoryError(400, "Game is not in progress");
  }

  const existingSubmission = game.submissions?.find(
    (submission) => submission.userId === userId(user)
  );
  if (existingSubmission) {
    return {
      game,
      submission: existingSubmission,
      result: null,
    };
  }

  const exam = await loadExam(game.examId);
  const questions = await loadQuestionsForExam(exam);
  const normalizedAnswers = normalizeAnswers(questions, answers);
  const submission = {
    userId: userId(user),
    userEmail: normalizeEmail(user.email),
    answers: normalizedAnswers,
    score: scoreAnswers(questions, normalizedAnswers),
    submittedAt: new Date(),
  };

  const updateResult = await getGames().updateOne(
    { _id: game._id, status: "in_progress", "submissions.userId": { $ne: userId(user) } },
    {
      $push: { submissions: submission },
      $set: { updated_at: new Date() },
    }
  );

  if (updateResult.modifiedCount === 0) {
    const duplicateGame = await getGames().findOne({ _id: game._id });
    const duplicateSubmission = duplicateGame?.submissions?.find(
      (savedSubmission) => savedSubmission.userId === userId(user)
    );

    if (duplicateGame && duplicateSubmission) {
      return {
        game: summarizeGame(duplicateGame),
        submission: duplicateSubmission,
        result:
          duplicateGame.status === "completed" ? buildResult(duplicateGame) : null,
      };
    }

    throw new GameRepositoryError(400, "Submission could not be saved");
  }

  const updatedGame = await getGames().findOne({ _id: game._id });
  if (!updatedGame) {
    throw new GameRepositoryError(404, "Game not found");
  }

  game = await finalizeIfBothSubmitted(updatedGame);

  return {
    game: summarizeGame(game),
    submission,
    result: game.status === "completed" ? buildResult(game) : null,
  };
};

const getResult = async (id: string, user: CurrentUser) => {
  const game = await findGameForUser(id, user);
  if (game.status !== "completed") {
    throw new GameRepositoryError(400, "Game result is not ready");
  }

  return buildResult(game);
};

const hydrateCurrentUser = async (email: string) => {
  const user = await fetchUserByEmail(normalizeEmail(email));
  if (!user?._id || !user.email) {
    throw new GameRepositoryError(401, "Authenticated user not found");
  }

  return ensureGameInviteCode(user._id);
};

export {
  createGame,
  listGames,
  getGame,
  acceptGame,
  startGame,
  getPlayableGame,
  submitAnswers,
  getResult,
  hydrateCurrentUser,
};
