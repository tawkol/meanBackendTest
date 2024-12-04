const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(4).max(15).required(),
  email: Joi.string()
    .email() // Automatically validates email pattern
    .required(),
  password: Joi.string().min(5).required(),
  phone: Joi.string().min(10).required()
});

module.exports = userSchema;
