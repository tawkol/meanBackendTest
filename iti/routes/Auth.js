const Validator = require("../middleware/AuthValidatorMW");
const User = require("../models/UserModelDB");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Logging in (Authentication)
router.post("/", Validator, async (req, res) => {
  try {
    // check if already exist
    let user = await User.findOne({ email: req.body.email }).exec();
    if (!user) return res.status(400).send("email or password incorrect");

    // checking password
    const isValidPswd = await bcrypt.compare(req.body.password, user.password);
    if (!isValidPswd)
      return res.status(400).send("email or password incorrect");

    // const token = user.genAuthToken();
    const token = jwt.sign({ userid: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {expiresIn: "72h"});

    // password correct
    res.header("x-auth-token", token);
    res.status(200).send("loggedin successfully");

  } catch (err) {
    // for (let i in err.errors) {
    //   console.log(err.errors[i].message);
    // }
    console.log(err);

    res.status(400).send("error while logging in");
  }
});

module.exports = router;
