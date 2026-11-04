import express from "express";



import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import { getPersonnelDashboard } from "../../controllers/admin/dashboardController.js";

const router = express.Router();



router.get("/", userAuth, adminAuth, getPersonnelDashboard);

export default router;