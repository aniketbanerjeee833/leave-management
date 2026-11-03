import express from "express";
import { createProfile, getAllProfilesByUser, getIndividualProfileById, 
    addAllergy, addCondition, addInsurance, addMedication, 
    editCondition,
    deleteCondition,
    editInsurance,
    deleteInsurance,
    editMedication,
    deleteMedication,
    editAllergy,
    deleteAllergy,
    editProfile,
    editAddress,
    addEmergencyContact,
    editEmergencyContact,
    deleteEmergencyContact,
    deleteIndividualProfile,
    editProfileImage,
    linkProductToQR,
    getIndividualProfileByQRCode,
    unlinkProductFromQR,
    getIndividualProfileByTagId,
    updateViewOrHideData,
    sendOtpToVerifyEnergencyContact,
    verifyOtpEmergencyContact,
    sendLocationMail,
    getEmergencyContactEmail} from "../controllers/profileController.js";
import createUploader from "../utils/upload.js";



const router = express.Router();
const userUpload = createUploader("user");
router.post("/create", userUpload.single("image"), createProfile);
router.put("/edit/:id", editProfile);
router.patch("/edit-profile-image/:id", userUpload.single("image"), editProfileImage);
router.delete("/delete/:id", deleteIndividualProfile);
router.get("/my-profile", getAllProfilesByUser);
router.get("/profile/:id", getIndividualProfileById); // for single profile details, can be used in future
router.get("/profile-by-tag-id/:tagId",getIndividualProfileByTagId)
router.put("/address/edit/:id", editAddress);


router.post("/emergency/add", addEmergencyContact);
router.patch("/emergency/edit/:id", editEmergencyContact);
router.delete("/emergency/delete/:id", deleteEmergencyContact);

router.post("/medication/add", addMedication);
router.put("/medication/edit/:id", editMedication);
router.delete("/medication/delete/:id", deleteMedication);

router.post("/allergy/add", addAllergy);
router.put("/allergy/edit/:id", editAllergy);
router.delete("/allergy/delete/:id", deleteAllergy);

router.post("/condition/add", addCondition);
router.put("/condition/edit/:id", editCondition);
router.delete("/condition/delete/:id", deleteCondition);

router.post("/insurance/add", addInsurance);
router.put("/insurance/edit/:id", editInsurance);
router.delete("/insurance/delete/:id", deleteInsurance);


router.post("/link-product-qr/:id", linkProductToQR);
router.patch("/unlink-product-qr/:id", unlinkProductFromQR);
router.get("/profile-details-qr/:code", getIndividualProfileByQRCode); // for QR code scanning and fetching profile details

router.patch("/update-view-status/:id", updateViewOrHideData);

router.post("/emergency-contact-otp", sendOtpToVerifyEnergencyContact);
router.post("/verify-emergency-contact-otp",verifyOtpEmergencyContact );
router.get("/emergency-contact-email/:code",getEmergencyContactEmail)
router.post("/send-location-email", sendLocationMail);

export default router;