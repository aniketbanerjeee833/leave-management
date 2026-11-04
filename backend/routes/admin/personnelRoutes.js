import express from "express";

import {
    // Personnel
    getAllPersonnel,
    getPersonnelById,
    updatePersonnel,

    // Leaves
    getAllLeaves,
    getLeaveById,
    addLeave,
    updateLeave,
    deleteLeave,
} from "../../controllers/admin/personnelController.js";

import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();
// ========================================
// LEAVE ROUTES
// Base URL: /api/admin/personnel/leaves
// ========================================

router.get("/leaves", userAuth, adminAuth, getAllLeaves);

router.get("/leaves/:leave_id", userAuth, adminAuth, getLeaveById);

router.post("/leaves", userAuth, adminAuth, addLeave);

router.put("/leaves/:leave_id", userAuth, adminAuth, updateLeave);

router.delete("/leaves/:leave_id", userAuth, adminAuth, deleteLeave);

// ========================================
// PERSONNEL ROUTES
// Base URL: /api/admin/personnel
// ========================================

router.get("/", userAuth, adminAuth, getAllPersonnel);

router.get("/:personnel_id", userAuth, adminAuth, getPersonnelById);

router.put("/:personnel_id", userAuth, adminAuth, updatePersonnel);



export default router;