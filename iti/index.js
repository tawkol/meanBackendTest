const express = require("express");
const router = express();
require("./config/db"); // Import the database connection
require("dotenv").config();
const cors = require("cors");
router.use(cors());

// important!!!! middleware to parse json to add it
router.use(express.json());

// router.use("/api/student", require("./routes/StudentsRoutes"));
router.use("/api/user", require("./routes/UserRoutes"));
router.use("/api/prod", require("./routes/ProductRoutes"));
router.use("/api/cart", require("./routes/CartRoutes"));
router.use("/api/order", require("./routes/OrderRoutes"));
router.use("/api/auth", require("./routes/Auth"));
// router.use("/api/admin", require("./routes/Admin"));

router.get("/test", (req, res) => {
  res.send("Server is working!");
});

// const port= process.env.PORT||3000;
const port = 3000;

router.listen(port, () => {
  console.log(`listening on ${port}.....!!!`);
});
