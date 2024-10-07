// // Authentication Validator middleware for (Logging-in) 

const validator = require("../util/AuthValidator");

module.exports = (req, res, next) => {
  const { error } = validator.validate(req.body); // Using Joi's validate method
  if (!error) {
    req.valid = true;
    next();
  } else {
    res.status(403).send("Logging-in data forbidden: not valid data for Logging-in");
  }
};
