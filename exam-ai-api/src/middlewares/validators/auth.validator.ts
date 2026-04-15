import Joi from "joi";
import { response } from "../../controller/response";
import { Request, Response, NextFunction } from "express";

const validateSignIn = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    response(res, {
      status: 400,
      message: error.details[0].message,
      data: null,
    });
    return;
  }
  next();
};

const validateEmailToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    validationToken: Joi.string().required(),
  });

  const { error } = schema.validate(req.params);
  if (error) {
    response(res, {
      status: 400,
      message: error.details[0].message,
      data: null,
    });
    return;
  }
  next();
};

const validatePasswordReset = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    response(res, {
      status: 400,
      message: error.details[0].message,
      data: null,
    });
    return;
  }
  next();
};

export { validateSignIn, validateEmailToken, validatePasswordReset };
