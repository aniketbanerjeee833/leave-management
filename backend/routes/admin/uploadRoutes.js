import express from "express";



import { uploadPersonnelExcel } from "../../controllers/admin/uploadController.js";
import excelUpload from "../../utils/excelUpload.js";

const router = express.Router();

router.post(
    "/personnel-excel",
    excelUpload.single("file"),
    uploadPersonnelExcel
);

export default router;