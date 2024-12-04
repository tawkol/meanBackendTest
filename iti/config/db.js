const mongoose = require("mongoose");
require("dotenv").config();

const uri = process.env.db;
// Connect to MongoDB
mongoose
  .connect(uri)
  .then(() => {
    console.log("Initial connection successful");
  })
  .catch((err) => {
    console.error("Initial connection error:", err);
  });

// Listen for connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose successfully connected to the database");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose encountered an error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection is disconnected");
});

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose connection closed due to app termination");
  process.exit(0);
});

module.exports = mongoose;
