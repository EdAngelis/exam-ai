import config from "../config/config";
import { response } from "../controller/response";
import { type Request, type Response, type NextFunction } from "express";

const API_KEY = config.api_key;
const MOBILE_API_KEY = config.mobile_api_key;

// Accepts either the web `x-api-key` or the mobile `x-mobile-api-key`, so the
// same resource routes can serve both the Next.js proxy and the React Native app.
const checkAppKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  const mobileApiKey = req.headers["x-mobile-api-key"];

  if ((apiKey && apiKey === API_KEY) || (mobileApiKey && mobileApiKey === MOBILE_API_KEY)) {
    next();
  } else {
    response(res, {
      message: "Forbidden: Invalid API key",
      data: null,
      status: 403,
    });
  }
};

export default checkAppKey;
