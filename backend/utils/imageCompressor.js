// const sharp = require('sharp');
// const path = require('path');
// const fs = require('fs');

// const compressImage = async (fileBuffer) => {
//   const filename = `${Math.floor(Math.random() * 9999)}-${Date.now()}.jpg`;
//   const filepath = path.join(__dirname, '../uploads', filename);

//   await sharp(fileBuffer)
//     .jpeg({ quality: 30 })
//     .toFile(filepath);

//   return `uploads/${filename}`;
// };

// module.exports = compressImage;
// import sharp from "sharp";
// import fs from "fs";
// import path from "path";

// const compressImage = async (filePath) => {
//   const folder = filePath.includes("admin") ? "admin" : "user";

//   const filename = `${Date.now()}-${Math.floor(Math.random() * 9999)}.jpg`;

//   const outputPath = `uploads/${folder}/${filename}`;

//   await sharp(filePath)
//     .jpeg({ quality: 30 })
//     .toFile(outputPath);

//   fs.unlinkSync(filePath);

//   // ✅ return clean DB path
//   // return `img/${folder}/${filename}`;
//   return `${folder}/${filename}`;
// };

// export default compressImage;
import sharp from "sharp";
import fs from "fs";
import path from "path";

const compressImage = async (filePath, customFolder = null) => {
  // ✅ decide folder
  let folder;

  if (customFolder) {
    folder = customFolder; // e.g. "admin/qr"
  } else {
    folder = filePath.includes("admin") ? "admin" : "user";
  }

  const filename = `${Date.now()}-${Math.floor(Math.random() * 9999)}.jpg`;

  const outputDir = path.join("uploads", folder);

  // create folder if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);

  await sharp(filePath)
    .jpeg({ quality: 60 })
    .toFile(outputPath);

  fs.unlinkSync(filePath);

  // ✅ return DB path
  return `${folder}/${filename}`;
};

export default compressImage;