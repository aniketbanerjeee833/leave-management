// const multer = require('multer');
// const path = require('path');

// const storage = multer.memoryStorage(); // store in buffer for compression

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
// });

// module.exports = upload;
import multer from "multer";
import path from "path";
import fs from "fs";

// function to create upload middleware dynamically
const createUploader = (folderName) => {
  const uploadDir = `./uploads/${folderName}`;

  // create folder if not exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG allowed"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
};

export default createUploader;