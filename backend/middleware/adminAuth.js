const adminAuth = (req, res, next) => {
 
  if (!req.user||req.user.role !== "admin") {
 
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  // Attach adminId for convenience
  req.adminId = req.user.User_Id;
  // console.log("Admin authenticated:", req.user.username);

  next();
};
    export default adminAuth;