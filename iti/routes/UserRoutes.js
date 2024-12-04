const userValidator = require("../middleware/UserValidatorMW");
const User = require("../models/UserModelDB");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Registration
// Ensure user cannot set isAdmin during registration
router.post("/", userValidator, async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(400).send("User already exists");

    // Hash the password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPswd = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPswd,
      isAdmin: false, // Ensure this is set to false by default
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userid: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "72h" }
    );

    // Send response with token
    res.header("x-auth-token", token);
    const data = {
      token: token,
      user,
    };
    return res.status(200).send(data);
  } catch (err) {
    console.error("Error during user registration:", err.message);

    // Improved error handling
    let errorMessage = "User registration failed";
    if (err.name === "ValidationError") {
      errorMessage = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      errorMessage = "User with this email already exists";
    }

    res.status(400).send(errorMessage);
  }
});

module.exports = router;
