import sharp from "sharp";
import fs from "fs";
import path from "path";

const compressProductImage = async (filePath, folder = "admin/products") => {
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 9999)}.jpg`;

  const outputDir = `uploads/${folder}`;

  // ensure folder exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = `${outputDir}/${fileName}`;

  await sharp(filePath)
    .jpeg({ quality: 40 }) // better balance
    .toFile(outputPath);

  // delete original uploaded file
  fs.unlinkSync(filePath);

  // return DB path (clean URL)
  return `${folder}/${fileName}`;
};

export default compressProductImage;