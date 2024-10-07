const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string()
    .pattern(new RegExp('^[A-Z][a-z]*$')) // Starts with a capital letter
    .min(4)
    .max(15)
    .required(),
  email: Joi.string()
    .email() // Automatically validates email pattern
    .required(),
  password: Joi.string()
    .min(5)
    .required(),
});

module.exports = userSchema;
