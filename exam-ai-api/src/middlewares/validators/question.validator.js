import Joi from "joi";

export const questionSchema = Joi.object({
  _id: Joi.string().optional(),
  userEmail: Joi.string().email().required(),
  userId: Joi.string().optional(),
  type: Joi.string().required(),
  subject: Joi.string().optional(),
  category: Joi.string().required(),
  subCategory: Joi.string().required(),
  question: Joi.string().required(),
  answer: Joi.number().required(),
  whenWrong: Joi.string().optional(),
  options: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        index: Joi.number().integer().required(),
      })
    )
    .length(4)
    .required(),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional(),
});
