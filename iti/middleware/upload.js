const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./assets/images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =  Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200000000 },// 200MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/mpeg"];
    if (allowedExtensions.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Extension not allowed!!"));
  },
});

module.exports = upload;
