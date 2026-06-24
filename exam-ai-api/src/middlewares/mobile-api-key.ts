import config from "../config/config";
import { response } from "../controller/response";
import { type Request, type Response, type NextFunction } from "express";

const MOBILE_API_KEY = config.mobile_api_key;

const checkMobileApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-mobile-api-key"];

  if (apiKey && apiKey === MOBILE_API_KEY) {
    next();
  } else {
    response(res, {
      message: "Forbidden: Invalid mobile API key",
      data: null,
      status: 403,
    });
  }
};

export default checkMobileApiKey;
