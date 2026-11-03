import express from "express";
import {  addContactUs, changePassword, loginUser, logoutUser, registerUser, sendOTP, verifyOTP } from "../controllers/userController.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/contact-us", addContactUs);

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/change-password", changePassword);

export default router;