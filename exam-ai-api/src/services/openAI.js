import OpenAI from "openai";
import config from "../config/config";

const key = config.open_ai_key;

const openai = new OpenAI({
  apiKey: key,
});

export default openai;
