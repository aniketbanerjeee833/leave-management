import express from "express"

import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import { getSingleTagText, getAllTagText, updateTagText, getAllWorks, getSingleWork, 
    updateWork, getSingleWork2, getAllWorks2, updateWork2, 
    addCustomerSay,
    getAllCustomerSay,
    getSingleCustomerSay,
    updateCustomerSay, deleteCustomerSay,
    addSliderImage,
    getAllSliderImages,
    deleteSliderImage,
    editSliderImage,
    editRegisterImage,
    getAllRegisterImage} from "../../controllers/admin/homeController.js";
import createUploader from "../../utils/upload.js";

const router = express.Router();

const imageUpload = createUploader("admin/slider_image");
router.post("/admin/home/slider-img", userAuth,adminAuth, imageUpload.single("image"), addSliderImage);
router.get("/home/slider-img",  getAllSliderImages);
router.delete("/admin/home/slider-img/delete/:id", userAuth,adminAuth, deleteSliderImage);
router.patch("/admin/home/slider-img/update/:id", userAuth,adminAuth, imageUpload.single("image"), editSliderImage);


router.get("/home/register-image",  getAllRegisterImage);
router.patch("/admin/home/register-image/update/:id", userAuth,adminAuth, imageUpload.single("image"), 
editRegisterImage);

router.get("/home/tag-text",  getAllTagText);
router.get("/admin/home/tag-text/:id",userAuth,adminAuth,  getSingleTagText);
router.put("/admin/home/tag-text/update/:id",userAuth,adminAuth,  updateTagText);

router.get("/home/works",  getAllWorks);
router.get("/admin/home/works/:id",userAuth,adminAuth,  getSingleWork);
router.put("/admin/home/works/update/:id",userAuth,adminAuth,  updateWork);

router.get("/home/works2",  getAllWorks2);
router.get("/admin/home/works2/:id",userAuth,adminAuth,  getSingleWork2);
router.put("/admin/home/works2/update/:id",userAuth,adminAuth,  updateWork2);


router.post("/admin/home/customer-say", userAuth,adminAuth, addCustomerSay);
router.get("/home/customer-say", getAllCustomerSay);
router.get("/admin/home/customer-say/:id",userAuth,adminAuth, getSingleCustomerSay);
router.patch("/admin/home/customer-say/update/:id", userAuth,adminAuth, updateCustomerSay);
router.delete("/admin/home/customer-say/delete/:id", userAuth,adminAuth, deleteCustomerSay);

export default router;