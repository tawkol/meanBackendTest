const mongoose = require("mongoose");

// Connection URI
// const uri = "mongodb+srv://iti:12345@cluster0.pvph0.mongodb.net/iti?retryWrites=true&w=majority&appName=Cluster0";
const uri = "mongodb+srv://zamtag11:9ZrnE6P4wkvfQvxR@meanprojectdb.o94sb.mongodb.net/";

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
