import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = path.join(process.cwd(), "uploads", "admin");

// Create uploads/admin automatically if it doesn't exist.
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const uniqueName = `personnel-${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${extension}`;

        cb(null, uniqueName);
    },
});

const excelUpload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if ([".xlsx", ".xls"].includes(extension)) {
            return cb(null, true);
        }

        cb(new Error("Only Excel files (.xlsx and .xls) are allowed."));
    },
});

export default excelUpload;