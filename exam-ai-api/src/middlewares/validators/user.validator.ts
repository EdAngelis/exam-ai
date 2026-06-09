import Joi from "joi";
import { response } from "../../controller/response";
import { Request, Response, NextFunction } from "express";

const userSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6),
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userSchema.validate(req.body);
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

const validateSignIn = (req: Request, res: Response, next: NextFunction) => {
  const { error } = signInSchema.validate(req.body);
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

export { validateUser, validateSignIn };
