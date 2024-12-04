const Validator = require("../middleware/AuthValidatorMW");
const User = require("../models/UserModelDB");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Logging in (Authentication)
router.post("/", Validator, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) return res.status(400).send("Email or password is incorrect");

    // Check password
    const isValidPwd = await bcrypt.compare(req.body.password, user.password);
    if (!isValidPwd)
      return res.status(400).send("Email or password is incorrect");

    // Generate token
    const token = jwt.sign(
      { userid: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "72h" }
    );

    // Respond with token and user data
    return res.status(200).send({
      token,
      user,
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).send("Internal server error while logging in");
  }
});

// Delete a user
router.delete("/", async (req, res) => {
  const token = req.header("x-auth-token");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).send("User not found");

    return res.status(200).send("User deleted successfully");
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).send("Error while deleting user");
  }
});

// Add an address
router.patch("/address", async (req, res) => {
  const token = req.header("x-auth-token");
  const { address } = req.body;

  if (!address) return res.status(400).send("Address data is required");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    const user = await User.findById(userId);

    if (!user) return res.status(404).send("User not found");

    // Add the new address
    user.address.push(address);

    // Save changes
    await user.save();
    return res.status(200).send({
      token,
      user,
    });
  } catch (err) {
    console.error("Error adding address:", err);
    return res.status(500).send("Error while adding address");
  }
});

// Update an address
router.patch("/address/update", async (req, res) => {
  const token = req.header("x-auth-token");
  const { updatedAddress, addressIndex } = req.body;

  if (addressIndex === undefined || !updatedAddress) {
    return res.status(400).send("Address index and updated data are required");
  }

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    const user = await User.findById(userId);

    if (!user) return res.status(404).send("User not found");

    // Validate the index
    if (addressIndex < 0 || addressIndex >= user.address.length) {
      return res.status(400).send("Invalid address index");
    }

    // Update the address
    user.address[addressIndex] = {
      ...user.address[addressIndex],
      ...updatedAddress,
    };

    // Save changes
    await user.save();
    // return res.status(200).send("Address updated successfully!");
    return res.status(200).send({
      token,
      user,
    });
  } catch (err) {
    console.error("Error updating address:", err);
    return res.status(500).send("Error while updating address");
  }
});

// Remove an address
router.patch("/address/remove", async (req, res) => {
  const token = req.header("x-auth-token");
  const { index } = req.body;

  if (index === undefined)
    return res.status(400).send("Address index is required");

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedPayload.userid;
    const user = await User.findById(userId);

    if (!user) return res.status(404).send("User not found");

    // Validate the index
    if (index < 0 || index >= user.address.length) {
      return res.status(400).send("Invalid address index");
    }

    // Remove the address
    user.address.splice(index, 1);

    // Save changes
    await user.save();
    // return res.status(200).send("Address removed successfully!");
    return res.status(200).send({
      token,
      user,
    });
  } catch (err) {
    console.error("Error removing address:", err);
    return res.status(500).send("Error while removing address");
  }
});

module.exports = router;
