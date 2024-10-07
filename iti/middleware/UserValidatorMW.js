const userSchema = require("../util/UserValidator");

// Middleware for validating requests
const validateUserRequest = (req, res, next) => {
  const { error } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ message: errors });
  }
  next(); // Move to the next middleware or route handler
};

module.exports = validateUserRequest;
