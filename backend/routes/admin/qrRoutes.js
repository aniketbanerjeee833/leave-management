import express from "express";



import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import { addQRTo1Year, addQRTo3Months, addQRTo6Months, createQR, 
    getAll1YearQRs, getAll3MonthsQRs, getAll6MonthsQRs, getAllExpiredQrs, getAllPrintedQRs, getAllQR, 
    printQR, 
    renewQrTo1Year,
    renewQrTo3Months,
    renewQrTo6Months} from "../../controllers/admin/QrController.js";

const router = express.Router();

router.post("/create",userAuth,adminAuth,createQR);
router.get("/all",userAuth,adminAuth,getAllQR);
router.patch("/print/:id",userAuth,adminAuth,printQR);
router.get("/all/printed-qr",userAuth,adminAuth,getAllPrintedQRs);
router.patch("/add-1-year/:id",userAuth,adminAuth, addQRTo1Year);
router.patch("/add-6-months/:id",userAuth,adminAuth, addQRTo6Months);
router.patch("/add-3-months/:id",userAuth,adminAuth, addQRTo3Months);

router.get("/1-year", userAuth,adminAuth,getAll1YearQRs);
router.get("/6-months", userAuth,adminAuth, getAll6MonthsQRs);
router.get("/3-months", userAuth,adminAuth, getAll3MonthsQRs);


router.get("/all-expired-qrs",userAuth,adminAuth,getAllExpiredQrs);
router.patch("/renew-1-year/:qrCode",userAuth,adminAuth, renewQrTo1Year);
router.patch("/renew-6-months/:qrCode",userAuth,adminAuth, renewQrTo6Months);
router.patch("/renew-3-months/:qrCode",userAuth,adminAuth, renewQrTo3Months);

export default router;