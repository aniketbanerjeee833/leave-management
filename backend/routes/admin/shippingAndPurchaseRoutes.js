import express from "express"

import { getAllPurchase, getAllShipping, updatePurchaseStatus } from "../../controllers/admin/shippingAndPurchaseController.js";
import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";

const router = express.Router();

router.get("/all-shipping",  userAuth,adminAuth,    getAllShipping);
router.get("/all-purchase",    userAuth,adminAuth,  getAllPurchase);
router.patch("/update-purchase-status/:id",    userAuth,adminAuth,  updatePurchaseStatus);

export default router;