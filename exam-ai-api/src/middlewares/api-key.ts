import config from "../config/config";
import { response } from "../controller/response";
import { type Request, type Response, type NextFunction } from "express";

const API_KEY = config.api_key;

const checkApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    response(res, {
      message: "Forbidden: Invalid API key",
      data: null,
      status: 403,
    });
  }
};

export default checkApiKey;
