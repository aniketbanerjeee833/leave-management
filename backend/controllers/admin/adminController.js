import db from "../../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
const isProduction=false
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 1;
const recordFailedAttempt = async (userId, ip) => {
  const effectiveUserId = userId || "UNKNOWN";
  const now = Date.now();
  const indiaOffset = 5.5 * 60 * 60 * 1000;

  // Find an existing user-specific attempt
  const [userRows] = await db.query(
    `SELECT *
     FROM admin_login_attempts
     WHERE User_Id = ?
     LIMIT 1`,
    [effectiveUserId]
  );

  let record = userRows[0];

  // If no user record exists, check the IP
  if (!record) {
    const [ipRows] = await db.query(
      `SELECT *
       FROM admin_login_attempts
       WHERE ip_address = ?
       LIMIT 1`,
      [ip]
    );

    record = ipRows[0];
  }

  // First failed attempt
  if (!record) {
    await db.query(
      `INSERT INTO admin_login_attempts
       (User_Id, ip_address, attempt_count, last_attempt)
       VALUES (?, ?, 1, NOW())`,
      [effectiveUserId, ip]
    );

    const [[newRow]] = await db.query(
      `SELECT *
       FROM admin_login_attempts
       WHERE User_Id = ? OR ip_address = ?
       LIMIT 1`,
      [effectiveUserId, ip]
    );

    return newRow;
  }

  // Increment failed attempts
  const newCount = Number(record.attempt_count) + 1;

  // Block after the maximum number of failed attempts
  const isBlocked = newCount >= MAX_ATTEMPTS;

  const blockedUntilMs = isBlocked
    ? now + BLOCK_DURATION_MINUTES * 60 * 1000
    : record.blocked_until_ms;

  const blockedUntil = isBlocked
    ? new Date(blockedUntilMs + indiaOffset)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")
    : record.blocked_until;

  await db.query(
    `UPDATE admin_login_attempts
     SET attempt_count = ?,
         last_attempt = NOW(),
         blocked_until = ?,
         blocked_until_ms = ?
     WHERE id = ?`,
    [newCount, blockedUntil, blockedUntilMs, record.id]
  );

  const [[updatedRow]] = await db.query(
    `SELECT *
     FROM admin_login_attempts
     WHERE id = ?`,
    [record.id]
  );

  return updatedRow;
};

// Clean up expired blocked attempts
const cleanupExpiredAttempts = async () => {
  const now = Date.now();

  await db.query(
    `DELETE FROM admin_login_attempts
     WHERE blocked_until_ms IS NOT NULL
       AND blocked_until_ms < ?`,
    [now]
  );
};

// ADMIN LOGIN
const adminLogin = async (req, res, next) => {
  try {
    // Get client IP.
    // Only trust X-Forwarded-For when your proxy is configured correctly.
    const forwardedFor = req.headers["x-forwarded-for"];

    const ip =
      (typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : req.socket.remoteAddress) || "UNKNOWN";

    await cleanupExpiredAttempts();

    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find admin
    const [users] = await db.query(
      `SELECT *
       FROM admin
       WHERE username = ?
       LIMIT 1`,
      [username]
    );

    const user = users[0];

    // Invalid username
    if (!user) {
      const attempt = await recordFailedAttempt(null, ip);

      if (
        attempt?.blocked_until_ms &&
        Number(attempt.blocked_until_ms) > Date.now()
      ) {
        const remaining = Math.ceil(
          (Number(attempt.blocked_until_ms) - Date.now()) / 60000
        );

        return res.status(429).json({
          success: false,
          message: `Too many login attempts. Please try again after ${remaining} minutes.`,
          blockedUntil: attempt.blocked_until_ms,
          blockedUntilReadable: attempt.blocked_until,
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check existing failed attempts for this user or IP
    const [attemptRows] = await db.query(
      `SELECT *
       FROM admin_login_attempts
       WHERE User_Id = ? OR ip_address = ?
       LIMIT 1`,
      [user.id, ip]
    );

    const attempt = attemptRows[0];
    const now = Date.now();

    // Reject login if currently blocked
    if (
      attempt?.blocked_until_ms &&
      Number(attempt.blocked_until_ms) > now
    ) {
      const remaining = Math.ceil(
        (Number(attempt.blocked_until_ms) - now) / 60000
      );

      return res.status(429).json({
        success: false,
        message: `Too many login attempts. Please try again after ${remaining} minutes.`,
        blockedUntil: attempt.blocked_until_ms,
        blockedUntilReadable: attempt.blocked_until,
      });
    }

    // Validate password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      const failedAttempt = await recordFailedAttempt(user.id, ip);

      if (
        failedAttempt?.blocked_until_ms &&
        Number(failedAttempt.blocked_until_ms) > Date.now()
      ) {
        const remaining = Math.ceil(
          (Number(failedAttempt.blocked_until_ms) - Date.now()) / 60000
        );

        return res.status(429).json({
          success: false,
          message: `Too many login attempts. Please try again after ${remaining} minutes.`,
          blockedUntil: failedAttempt.blocked_until_ms,
          blockedUntilReadable: failedAttempt.blocked_until,
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Successful login: clear failed attempts for this user
    await db.query(
      `DELETE FROM admin_login_attempts
       WHERE User_Id = ?`,
      [user.id]
    );

    // Create a separate session for each login.
    // Multiple browsers/devices can now log in simultaneously.
    const sessionId = crypto.randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO admin_sessions
       (Session_Id, User_Id, created_at, expires_at)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [sessionId, user.id]
    );

    // Set session cookie
    res.cookie("admin_session_id", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Respond successfully
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    next(err);
  }
};

// ADMIN LOGOUT
const adminLogout = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.admin_session_id;

    // Delete only the current browser's session
    if (sessionId) {
      await db.query(
        `DELETE FROM admin_sessions
         WHERE Session_Id = ?`,
        [sessionId]
      );
    }

    // Clear the cookie
    res.clearCookie("admin_session_id", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);
    next(err);
  }
};
// const recordFailedAttempt = async (userId, ip) => {
//   const effectiveUserId = userId || "UNKNOWN";
//   const now = Date.now();
//   const indiaOffset = 5.5 * 60 * 60 * 1000;

//   //  Try to find user-specific attempt first
//   const [userRows] = await db.query(
//     `SELECT * FROM admin_login_attempts WHERE User_Id = ? LIMIT 1`,
//     [effectiveUserId]
//   );

//   //  If not found, check IP-based attempt
//   let record = userRows[0];
//   if (!record) {
//     const [ipRows] = await db.query(
//       `SELECT * FROM admin_login_attempts WHERE ip_address = ? LIMIT 1`,
//       [ip]
//     );
//     record = ipRows[0];
//   }

//   //  3 First failed attempt — insert new
//   if (!record) {
//     await db.query(
//       `INSERT INTO admin_login_attempts (User_Id, ip_address, attempt_count, last_attempt)
//        VALUES (?, ?, 1, NOW())`,
//       [effectiveUserId, ip]
//     );

//     const [[newRow]] = await db.query(
//       `SELECT * FROM admin_login_attempts WHERE User_Id = ? OR ip_address = ? LIMIT 1`,
//       [effectiveUserId, ip]
//     );
//     return newRow;
//   }

//   //  Increment attempt count
//   const newCount = record.attempt_count + 1;
//   const blockedUntilMs =
//     newCount >= MAX_ATTEMPTS ? now + BLOCK_DURATION_MINUTES * 60 * 1000 : record.blocked_until_ms;
//   const blockedUntil =
//     newCount >= MAX_ATTEMPTS
//       ? new Date(blockedUntilMs + indiaOffset).toISOString().slice(0, 19).replace("T", " ")
//       : record.blocked_until;

//   //  Update row
//   await db.query(
//     `UPDATE admin_login_attempts 
//      SET attempt_count = ?, last_attempt = NOW(),
//          blocked_until = ?, blocked_until_ms = ?
//      WHERE id = ?`,
//     [newCount, blockedUntil, blockedUntilMs, record.id]
//   );

//   //  Fetch & return latest record
//   const [[updatedRow]] = await db.query(
//     `SELECT * FROM admin_login_attempts WHERE id = ?`,
//     [record.id]
//   );

//   return updatedRow;
// };

// const cleanupExpiredAttempts = async () => {
//   const now = Date.now();

//   //  Delete all attempts that expired more than a minute ago
//   await db.query(
//     `DELETE FROM admin_login_attempts 
//      WHERE blocked_until_ms IS NOT NULL 
//      AND blocked_until_ms < ?`,
//     [now]
//   );

//   // Optionally, also clear IP-only or "UNKNOWN" users after expiry
//   await db.query(
//     `DELETE FROM admin_login_attempts 
//      WHERE User_Id = 'UNKNOWN' 
//      AND blocked_until_ms IS NOT NULL 
//      AND blocked_until_ms < ?`,
//     [now]
//   );
// };

// const adminLogin = async (req, res, next) => {
//   try {
//      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
//     await cleanupExpiredAttempts(); // cleanup old login attempts first
//     // const cleanData = sanitizeObject(req.body);
//     // const parsed = loginSchema.safeParse(cleanData);

//     // if (!parsed.success) {
//     //   const errors = parsed.error?.errors?.map((e) => e.message) || ["Invalid input"];
//     //   return res.status(400).json({ success: false, errors });
//     // }

//     const { username, password } = req.body;
//     if(!username || !password){
//       return res.status(400).json({ success: false, message: "Username and password are required" });
//     }
//     //const ip = req.ip;

//     // 🔹 1️⃣ Find user
//     const [users] = await db.query(`SELECT * FROM admin WHERE username = ?`, [username]);
//     const user = users[0];

//     // ❌ Invalid username
//     if (!user) {
//       const attempt = await recordFailedAttempt(null, ip);
//       if (attempt?.blocked_until_ms && attempt.blocked_until_ms > Date.now()) {
//         const remaining = Math.ceil((attempt.blocked_until_ms - Date.now()) / 60000);
//         return res.status(429).json({
//           success: false,
//           message: `Too many login attempts. Please try again after ${remaining} minutes.`,
//           blockedUntil: attempt.blocked_until_ms,
//           blockedUntilReadable: attempt.blocked_until,
//         });
//       }

//       return res.status(401).json({
//         success: false,
//         message: "Invalid username",
//         attempt,
//       });
//     }

//     // 🔹 2️⃣ Check if user is blocked
//     const [attemptRows] = await db.query(
//       `SELECT * FROM admin_login_attempts WHERE User_Id = ? OR ip_address = ? LIMIT 1`,
//       [user.id, ip]
//     );

//     const attempt = attemptRows[0];
//     const now = Date.now();

//     if (attempt && attempt.blocked_until_ms && attempt.blocked_until_ms > now) {
//       const remaining = Math.ceil((attempt.blocked_until_ms - now) / 60000);
//       return res.status(429).json({
//         success: false,
//         message: `Too many login attempts. Please try again after ${remaining} minutes.`,
//         blockedUntil: attempt.blocked_until_ms,
//         blockedUntilReadable: attempt.blocked_until,
//       });
//     }


//   await db.query(`DELETE FROM admin_sessions WHERE User_Id = ? AND expires_at <= NOW()`, [user.id]);

//     // 🔹 4️⃣ Check if any active session still exists
//     const [existingSessions] = await db.query(
//       `SELECT * FROM admin_sessions WHERE User_Id = ? AND expires_at > NOW()`,
//       [user.id]
//     );

//     if (existingSessions.length > 0) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You are already logged in on another device. Please log out there to continue.",
//       });
//     }

//     // 🔹 Validate password
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       const attempt = await recordFailedAttempt(user.id, ip);
//       if (attempt?.blocked_until_ms && attempt.blocked_until_ms > Date.now()) {
//         const remaining = Math.ceil((attempt.blocked_until_ms - Date.now()) / 60000);
//         return res.status(429).json({
//           success: false,
//           message: `Too many login attempts. Please try again after ${remaining} minutes.`,
//           blockedUntil: attempt.blocked_until_ms,
//           blockedUntilReadable: attempt.blocked_until,
//         });
//       }

//       return res.status(401).json({ success: false, message: "Invalid password", attempt });
//     }

//     // 🔹  Success — clear failed attempts
// await db.query(
//   `DELETE FROM admin_login_attempts 
//    WHERE User_Id = ? 
//    OR (User_Id = 'UNKNOWN' AND ip_address = ?)`,
//   [user.id, ip]
// );
// const userAgent = req.headers["user-agent"];
// console.log(userAgent);
//     // 🔹  Create new session
//     const sessionId = crypto.randomBytes(32).toString("hex");
//     await db.query(
//       `INSERT INTO admin_sessions (Session_Id, User_Id, created_at, expires_at)
//        VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
//       [sessionId, user.id]
//     );

//     // 🔹  Set secure cookie
//     res.cookie("admin_session_id", sessionId, {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite: "Lax",
//       path: "/",
//       maxAge: 24 * 60 * 60 * 1000
       
//     });



//     // 🔹 Respond success
//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       user: {
//         id: user.id,
        
//         name: user.name,
//         email: user.email,
//         username: user.username,
//         role: user.role,
       
//       },
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//    next(err);
//   }
// };

// const adminLogout = async (req, res,next) => {
//   try {
//     const sessionId = req.cookies.admin_session_id;
//     if (sessionId) {
//       await db.query(`DELETE FROM admin_sessions WHERE Session_Id = ?`, [sessionId]);
//     }

//     res.clearCookie("admin_session_id", {
//       httpOnly: true,
//       secure: isProduction,
//       sameSite: isProduction ? "None" : "Lax",
//       path: "/"
//     });

//     return res.status(200).json({ success: true, message: "Logout successful" });
//   } catch (err) {
//     console.error("Logout error:", err);
//  next(err);
  
//   }
// };
const getUser = async (req, res, next) => {
  try {
    const sessionId = req.cookies.admin_session_id;
    if (!sessionId) {
      return res.json({ authenticated: false, user: null });
    }

    const [rows] = await db.query(
      `SELECT us.User_Id, u.id, u.name,  u.username, u.role
       FROM admin_sessions us
       JOIN admin u ON us.User_Id = u.id
       WHERE us.session_id = ? AND us.expires_at > NOW()`,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.json({ authenticated: false, user: null });
    }

    return res.json({
      authenticated: true,
      success: true,
      user: rows[0],
    });
  } catch (err) {
    console.error("GetUser error:", err);
    next(err);
  }
};
const getAllContactUs = async (req, res, next) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    // 🔍 Search
    if (search) {
      searchQuery = `
        WHERE (
          name LIKE ?
          OR email LIKE ?
          OR ph LIKE ?
          OR comment LIKE ?
        )
      `;
      values = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ];
    }

    connection = await db.getConnection();

    // ✅ Get Data
    const [rows] = await connection.query(
      `
      SELECT id, name,email,ph,comment,DATE_FORMAT(datetime,'%Y-%m-%d %H:%i:%s') as datetime
      FROM contact
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // ✅ Get Total Count
    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM contact
      ${searchQuery}
      `,
      values
    );

    const total = countResult[0].total;

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error("GetContactUs error:", err);
    next(err);
  } finally {
    if (connection) connection.release(); // ✅ important
  }
};


export { adminLogin, adminLogout, getUser, getAllContactUs };