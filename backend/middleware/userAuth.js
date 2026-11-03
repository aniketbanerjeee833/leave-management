
import db from "../config/db.js";


// Promise-based version of userAuth middleware

const userAuth = async (req, res, next) => {
  try {
    const sessionId = req.cookies.admin_session_id;

    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const [results] = await db.query(`
      SELECT 
        us.User_Id,
        u.name, 
        u.username, 
        u.role
      FROM admin_sessions us
      JOIN admin u ON us.User_Id = u.id
      WHERE us.Session_Id = ? 
        AND us.expires_at > NOW()
    `, [sessionId]);

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session"
      });
    }

    req.user = {
      User_Id: results[0].User_Id,
      name: results[0].name,
      username: results[0].username,
      role: results[0].role,
    };

    next();

  } catch (err) {
    console.error("❌ Session validation error:", err);
    next(err);
  }
};

export default userAuth;
