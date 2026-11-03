


import express from "express";
import userAuth from "../../middleware/userAuth.js";
import adminAuth from "../../middleware/adminAuth.js";
import { assignTagToUser,  assignUserToGroup,  createGroup,  deleteGroup,  deleteRegisteredMember, 
    disableAssignedTagToUser, getAllGroups, getAllRegisteredMembers, 
    getMemberGroups, 
    getProfilesByUser, 
  
    syncMemberGroups} from "../../controllers/admin/registeredMembersController.js";
const router=express.Router();

router.get("/all",userAuth,adminAuth,getAllRegisteredMembers);
router.get("/profile/:id",userAuth,adminAuth,getProfilesByUser);
router.patch("/assign-tag/:id",userAuth,adminAuth,assignTagToUser);
router.patch("/assign-tag/disable/:id",userAuth,adminAuth,disableAssignedTagToUser);
router.delete("/delete/profile/:id",userAuth,adminAuth,deleteRegisteredMember);
router.post("/group",userAuth,adminAuth, createGroup);
router.delete("/group/:groupId",userAuth,adminAuth, deleteGroup);
router.get("/group",userAuth,adminAuth, getAllGroups);

router.post("/group/:groupId/members/:registerId",userAuth,adminAuth,assignUserToGroup);

// router.delete("/group/:groupId/members/:registerId",userAuth,adminAuth,removeUserFromGroup);
router.get("/group/member/:registerId/groups", userAuth, adminAuth, getMemberGroups);
router.put("/group/member/:registerId/groups", userAuth, adminAuth, syncMemberGroups);
export default router;