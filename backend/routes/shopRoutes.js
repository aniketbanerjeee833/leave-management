import express from "express";
import { addPurchase, addShipping, getShippingByInId } from "../controllers/shopController.js";
const router  = express.Router();
// const {
//   addShipping, addPurchase,
 
//   getShippingByInId,
// } = require("../controllers/shopController");

router.post("/shipping/add",      addShipping);
router.post("/purchase/add",      addPurchase);
// router.get( "/shipping/all",      getAllShipping);
// router.get( "/purchase/all",      getAllPurchase);
router.get( "/shipping/:inId",    getShippingByInId);
export default router;