import db from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
 const safe= (val) => val ?? "";
// Add User
// Get Users

const isProduction=false


const registerUser = async (req, res, next) => {
  let connection;

  try {
    /* ---------------- BODY SAFETY ---------------- */
    // if (!req.body || Object.keys(req.body).length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Request body is required",
    //   });
    // }

    const { name, mobile, password } = req.body;

    // ✅ Basic validation
    if (!mobile || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Mobile, name, and password are required",
      });
    }

     connection = await db.getConnection();
    await connection.beginTransaction();

    /* ---------------- DUPLICATE CHECK ---------------- */
    const [existing] = await connection.query(
      `SELECT id FROM register WHERE mobile = ? LIMIT 1`,
      [mobile]
    );

    if (existing.length) {
    
      return res.status(400).json({
        success: false,
        message: "Already registered",
      });
    }
   

    /* ---------------- HASH PASSWORD ---------------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------------- INSERT USER ---------------- */
    await connection.query(
      `INSERT INTO register
       (mobile, password, name,  date)
       VALUES (?, ?,?,  NOW())`,
      [
        mobile,
        
        hashedPassword,
        name
   
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Register Error:", err);
    //next(err);
  } finally {
    if (connection) connection.release();
  }
};

const loginUser = async (req, res, next) => {
  try {
     

    

    const { mobile, password } = req.body;
    //const ip = req.ip;

    // 🔹 1️⃣ Find user
    const [users] = await db.query(`SELECT * FROM register WHERE mobile = ?`, [mobile]);
    const user = users[0];
    if(!user){
      return res.status(401).json({ success: false, message: "User not exists, please register" });
    }

    // ❌ Invalid username
  //   if (!user || user.username !== username) {
  //     const attempt = await recordFailedAttempt(null, ip);
  //     if (attempt?.blocked_until_ms && attempt.blocked_until_ms > Date.now()) {
  //       const remaining = Math.ceil((attempt.blocked_until_ms - Date.now()) / 60000);
  //       return res.status(429).json({
  //         success: false,
  //         message: `Too many login attempts. Please try again after ${remaining} minutes.`,
  //         blockedUntil: attempt.blocked_until_ms,
  //         blockedUntilReadable: attempt.blocked_until,
  //       });
  //     }

  //     return res.status(401).json({
  //       success: false,
  //       message: "Invalid username",
  //       attempt,
  //     });
  //   }

  //   // 🔹 2️⃣ Check if user is blocked
  //   const [attemptRows] = await db.query(
  //     `SELECT * FROM admin_login_attempts WHERE User_Id = ? OR ip_address = ? LIMIT 1`,
  //     [user.User_Id, ip]
  //   );

  //   const attempt = attemptRows[0];
  //   const now = Date.now();

  //   if (attempt && attempt.blocked_until_ms && attempt.blocked_until_ms > now) {
  //     const remaining = Math.ceil((attempt.blocked_until_ms - now) / 60000);
  //     return res.status(429).json({
  //       success: false,
  //       message: `Too many login attempts. Please try again after ${remaining} minutes.`,
  //       blockedUntil: attempt.blocked_until_ms,
  //       blockedUntilReadable: attempt.blocked_until,
  //     });
  //   }


  // await db.query(`DELETE FROM admin_sessions WHERE User_Id = ? AND expires_at <= NOW()`, [user.User_Id]);

  //   // 🔹 4️⃣ Check if any active session still exists
  //   const [existingSessions] = await db.query(
  //     `SELECT * FROM admin_sessions WHERE User_Id = ? AND expires_at > NOW()`,
  //     [user.User_Id]
  //   );

  //   if (existingSessions.length > 0) {
  //     return res.status(403).json({
  //       success: false,
  //       message:
  //         "You are already logged in on another device. Please log out there to continue.",
  //     });
  //   }

    // 🔹 Validate password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
 

      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // 🔹  Success — clear failed attempts

    // 🔹  Create new session
    const sessionId = crypto.randomBytes(32).toString("hex");
    // await db.query(
    //   `INSERT INTO admin_sessions (Session_Id, User_Id, created_at, expires_at)
    //    VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
    //   [sessionId, user.User_Id]
    // );

    // 🔹  Set secure cookie
    res.cookie("session_id", sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Lax",
      path: "/"
       
    });

// let categories = [];

// if (user.role === "kitchen-staff") {
//   const [rows] = await db.query(
//     `SELECT Category_Names
//      FROM kitchen_staff_categories
//      WHERE User_Id = ?`,
//     [user.User_Id]
//   );

//   categories = rows.map((r) => r.Category_Names);
// }

    // 🔹 Respond success
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        mobile: user.mobile
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ success: false, message: "An error occurred during login" });
   //next(err);
  }
};


const logoutUser = async (req, res,next) => {
  try {
    //const sessionId = req.cookies.session_id;
    // if (sessionId) {
    //   await db.query(`DELETE FROM admin_sessions WHERE Session_Id = ?`, [sessionId]);
    // }

    res.clearCookie("session_id", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      path: "/"
    });

    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
 //next(err);
  
  }
};

//ADMIN


const addContactUs=async(req,res,next)=>{
  let connection;
  try{
    const {name,email,ph,message}=req.body;
    if(!name) return res.status(400).json({ success: false, message: "name required" });
    if(!email) return res.status(400).json({ success: false, message: "email required" });
   
    connection=await db.getConnection();
    await connection.beginTransaction();
    const [results]=await db.query(`INSERT INTO contact (name,email,ph,comment)VALUES(?,?,?,?)`,
      [safe(name),safe(email),safe(ph),safe(message)]);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Contact us added",id:results.insertId });
  }
  catch(err){
    return res.status(500).json({ success: false, error: err.message });
  }finally{
    if(connection)connection.release();
  }
}

// const generateOTP = () => {
//   return Math.floor(1000 + Math.random() * 9000).toString();
// };

// const sendOTP = async (req, res) => {
//   let connection;
//   try {
//     const { mobile } = req.body;

//     if (!mobile) {
//       return res.status(400).json({ message: "Mobile number required" });
//     }
//      connection=await db.getConnection();
//     await connection.beginTransaction();

//     // 🔒 Rate limit (basic)
//     // if (otpStore.has(mobile)) {
//     //   return res.status(400).json({ message: "Please wait before requesting again" });
//     // }

//     const otp = generateOTP();

//     //const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
//     //otpStore.set(mobile, { otp, expiresAt });

//     // 📩 Your SMS message
//     const msg = `Welcome to TAGWAY. Your OTP is ${otp}. In case of emergency situation TAGWAY provides important information through QR Scanning. CLPLSE`;

//     const encodedMsg = encodeURIComponent(msg);

//     // 🔥 BulkSMS API URL
//     const url = `http://sms.bulksmsind.in/v2/sendSMS?username=techsms&message=${encodedMsg}&sendername=CLPLSE&smstype=TRANS&numbers=${mobile}&apikey=YOUR_API_KEY&peid=1701161605309086220&templateid=1707177321124930407`;

//     // 📡 API call
//     // const response = await axios.post(url);

//     // console.log("SMS API Response:", response.data);
//     const response = await fetch(url, {
//       method: "POST"
//     });

//     const data = await response.text(); // BulkSMS usually returns text

//     console.log("SMS Response:", data);
//     await connection.commit()
//     return res.status(200).json({
//       message: "OTP sent successfully",
//     });

//   } catch (error) {
//     console.error("Send OTP Error:", error.message);

//     return res.status(500).json({
//       message: "Failed to send OTP",
//     });
//   }
// };

// const verifyOTP = async (req, res) => {
//   let connection;
//   try {
//     const { mobile, otp } = req.body;

//     if (!mobile || !otp) {
//       return res.status(400).json({ message: "Mobile & OTP required" });
//     }
//      connection=await db.getConnection();
//     await connection.beginTransaction();
//     //const record = otpStore.get(mobile);

//     // if (!record) {
//     //   return res.status(400).json({ message: "OTP not found or expired" });
//     // }

//     // check expiry
//     if (Date.now() > record.expiresAt) {
//       //otpStore.delete(mobile);
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     if (record.otp !== otp) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // ✅ success → delete OTP
//     //otpStore.delete(mobile);
//     await connection.commit()
//     return res.status(200).json({
//       message: "OTP verified successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }finally{
//     if(connection)connection.release();
//   }
// };

const sendOTP = async (req, res) => {
  let connection;
  try {
    const { mobile, type } = req.body;

    if (!mobile || !type) {
      return res.status(400).json({ message: "Mobile and type required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔍 Check user exists
    const [existingUser] = await connection.query(
      "SELECT id FROM register WHERE mobile = ?",
      [mobile]
    );

    // 🧠 Logic based on type
    if (type === "register" && existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "User already exists, please login",
      });
    }

    if (type === "forgot" && existingUser.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "User does not exist, please register",
      });
    }

    // 🔢 Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 🔁 Insert or update OTP
    const [existingOtp] = await connection.query(
      "SELECT * FROM otp_verification WHERE mobile = ?",
      [mobile]
    );

    if (existingOtp.length > 0) {
      await connection.query(
        "UPDATE otp_verification SET otp = ? WHERE mobile = ?",
        [otp, mobile]
      );
    } else {
      await connection.query(
        "INSERT INTO otp_verification (mobile, otp) VALUES (?, ?)",
        [mobile, otp]
      );
    }

    // 📩 Send SMS
    // const msg = `Your OTP is ${otp}`;
    const msg = `Welcome to TAGWAY. Your OTP is ${otp}. In case of emergency situation TAGWAY provides important information through QR Scanning. CLPLSE`;
    const encodedMsg = encodeURIComponent(msg);

      const url = `http://sms.bulksmsind.in/v2/sendSMS?username=techsms&message=${encodedMsg}&sendername=CLPLSE&smstype=TRANS&numbers=${mobile}&apikey=8a8651c3-cc8e-40cd-a0d6-e841d35e1708&peid=1701161605309086220&templateid=1707177321124930407`;


    await fetch(url, { method: "POST" });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      message: "Failed to send OTP",
    });
  } finally {
    if (connection) connection.release();
  }
};
//  const sendOTP = async (req, res) => {
//   let connection;
//   try {
//     const { mobile } = req.body;

//     if (!mobile) {
//       return res.status(400).json({ message: "Mobile number required" });
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();

    
  
//    // 🔥 Check user exists
//     const [existingUser] = await connection.query(
//       "SELECT id FROM register WHERE mobile = ?",
//       [mobile]
//     );

//     if (!existingUser.length) {
//       await connection.rollback();
//       return res.status(400).json({
//         message: "User does not exist, please register",
//       });
//     }
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     // ✅ Check if OTP already exists → update
//     const [existing] = await connection.query(
//       "SELECT * FROM otp_verification WHERE mobile = ?",
//       [mobile]
//     );

//     if (existing.length > 0) {
//       await connection.query(
//         "UPDATE otp_verification SET otp = ? WHERE mobile = ?",
//         [otp,  mobile]
//       );
//     } else {
//       await connection.query(
//         "INSERT INTO otp_verification (mobile, otp) VALUES (?, ?)",
//         [mobile, otp]
//       );
//     }

//     // 📩 SMS Message
//     const msg = `Welcome to TAGWAY. Your OTP is ${otp}. In case of emergency situation TAGWAY provides important information through QR Scanning. CLPLSE`;
//     const encodedMsg = encodeURIComponent(msg);

//     const url = `http://sms.bulksmsind.in/v2/sendSMS?username=techsms&message=${encodedMsg}&sendername=CLPLSE&smstype=TRANS&numbers=${mobile}&apikey=8a8651c3-cc8e-40cd-a0d6-e841d35e1708&peid=1701161605309086220&templateid=1707177321124930407`;

//     const response = await fetch(url, { method: "POST" });
//     const data = await response.text();

//     //console.log("SMS Response:", data);

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });

//   } catch (error) {
//     if (connection) await connection.rollback();
//     console.error("Send OTP Error:", error);

//     return res.status(500).json({
//       message: "Failed to send OTP",
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };

const verifyOTP = async (req, res) => {
  let connection;
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile & OTP required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM otp_verification WHERE mobile = ?",
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: "OTP not found. Please request again",
      });
    }

    const record = rows[0];

 
   

    // ❌ Wrong OTP
    if (record.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // ✅ Success → delete OTP
    await connection.query(
      "DELETE FROM otp_verification WHERE mobile = ?",
      [mobile]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  } finally {
    if (connection) connection.release();
  }
};


const changePassword = async (req, res) => {
  let connection;

  try {
    const { mobile,  newPassword } = req.body;

    // 🔒 Basic validation
    if (!mobile ||  !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mobile,  and new password are required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔍 Check user exists
    const [rows] = await connection.query(
      `SELECT id, password FROM register WHERE mobile = ? LIMIT 1`,
      [mobile]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    // 🔑 Verify old password
    //const isMatch = await bcrypt.compare(oldPassword, user.password);

   

    // 🔐 Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 🔄 Update password
    await connection.query(
      `UPDATE register SET password = ? WHERE mobile = ?`,
      [hashedNewPassword, mobile]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Change Password Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  } finally {
    if (connection) connection.release();
  }
};
export {registerUser,loginUser,logoutUser,addContactUs,sendOTP,verifyOTP,changePassword };