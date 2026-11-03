import express from "express";


import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import { addDiscount, addProduct, deleteProduct, getAllDiscounts, getAllProducts,
    editProduct,
    deleteDiscount,
    getAllShippingPrices
 } from "../../controllers/admin/productController.js";
import createUploader from "../../utils/upload.js";

const router = express.Router();
const productUpload = createUploader("admin/products");
// ✅ Route
router.post("/add",userAuth,adminAuth,productUpload.single("image"),addProduct);
router.get("/all-products",getAllProducts);
router.delete("/delete/:id",userAuth,adminAuth,deleteProduct);
router.put("/edit/:id",userAuth,adminAuth, productUpload.single("image"),editProduct);

router.post("/discount",userAuth,adminAuth,addDiscount);
router.delete("/delete/discount/:id",userAuth,adminAuth,deleteDiscount);
router.get("/all-discounts",getAllDiscounts);

router.get("/all-shipping-prices",getAllShippingPrices);
export default router;