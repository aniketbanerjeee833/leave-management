import express from "express";


import { adminLogin, adminLogout, getAllContactUs, getUser } from "../../controllers/admin/adminController.js";
import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/logout",userAuth,adminAuth, adminLogout);
router.get("/me",getUser);
router.get("/contact-us/all",userAuth,adminAuth,getAllContactUs);
export default router;