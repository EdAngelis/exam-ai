import openAIRequest from "../services/openAI";

const DIFFICULTY_INSTRUCTIONS = {
  easy: "Generate easy questions suitable for children: use simple language, short sentences, and focus on basic, well-known concepts.",
  medium: "Generate medium difficulty questions for general adults: use clear standard language and cover non-specialist general knowledge.",
  hard: "Generate hard, advanced questions for domain specialists: use technical terminology, require in-depth reasoning, and target expert-level knowledge.",
};

const questionsByAi = async (
  category,
  subCategory,
  subject,
  text,
  lang,
  numberOfQuestions,
  choiceQuestionSchema,
  difficulty
) => {
  const schema = JSON.stringify(choiceQuestionSchema);

  const prompt = formatPrompt(
    category,
    subCategory,
    subject,
    text,
    numberOfQuestions
  );

  const difficultyInstruction =
    DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.medium;

  const openAIParams = {
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate quiz questions based on a topic, text or url, and is important to returns just the data in JSON format, put each question in JSON structure like this ${schema} where the question will be on the field question, give four plausive options where just one is the correct, put the correct answer at the field answer as a number corresponding to its index in the options array, put an explanation on the field whenWrong, and responde in ${lang}. ${difficultyInstruction}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const completion = await openAIRequest.chat.completions.create(openAIParams);

  const response = JSON.parse(completion.choices[0].message.content);

  console.log("Questions created:", response.questions.length);

  return response.questions;
};

const formatPrompt = (
  category,
  subCategory,
  subject,
  text,
  numberOfQuestions
) => {
  let prompt = "";
  let typePrompt = "";
  let site = "";

  if (text) {
    typePrompt = text.split("://")[0].includes("http") ? "url" : "text";
    site = typePrompt === "url" ? text : "";
  } else {
    typePrompt = "text";
  }

  switch (typePrompt) {
    case "url":
      prompt = `Give me a array of ${numberOfQuestions} questions about the content of the site ${site}`;
      break;
    default:
      prompt = `Give me a array of ${numberOfQuestions} questions about ${category}, ${subCategory}, ${subject}, ${text}`;
  }

  return prompt;
};

export default questionsByAi;
