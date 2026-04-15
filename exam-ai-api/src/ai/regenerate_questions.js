import openAIRequest from "../services/openAI";

const regenerateQuestions = async (questions, text) => {
  const prompt = `${text} in these questions ${questions} and return the objects inside a array of json even if there is just one question.`;

  const openAIParams = {
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You will take questions in a array of objects, change the questions as the user requested. 
        is important to keep the same format and return the json objects inside a array even if there is just one question.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  const completion = await openAIRequest.chat.completions.create(openAIParams);

  console.dir(completion, { depth: null });
  const response = JSON.parse(completion.choices[0].message.content);
  console.log("RESPONSE");
  console.dir(response, { depth: null });

  return response.questions;
};

export default regenerateQuestions;
