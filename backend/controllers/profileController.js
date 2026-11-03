import db from "../config/db.js";
import compressImage from "../utils/imageCompressor.js";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer"

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 const safe= (val) => val ?? "";
// const createProfile = async (req, res) => {
//      let connection;
//   try {
//     const {
//       name,
//       email,
//       dob,
//       gender,
//       city,
//       state,
//       pin,
//       profile,
//       register_id
//     } = req.body;

//     if(!email){
//       return res.status(400).json({
//         success: false,
//         message: "Email is required"
//       });
//     }
//     if(!profile){
//       return res.status(400).json({
//         success: false,
//         message: "Profile type is required"
//       });
//     }
    
//         connection = await db.getConnection();
//         await connection.beginTransaction();

//     let imagePath = null;

//     // If image exists
//     if (req.file) {
//      imagePath = await compressImage(req.file.path);;
//     }

//     const query = `
//       INSERT INTO information 
//       (name, email, dob, gender, city, state, pin, profile, register_id, image)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       name,
//       email,
//       dob,
//       gender,
//       city,
//       state,
//       pin,
//       profile,
//       register_id,
//       imagePath
//     ];

//     await connection.execute(query, values);
    
//     await connection.commit();
//     res.status(201).json({
//       success: true,
//       message: "Profile Successfully Inserted"
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("Register Error:", err);
//     //next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

//PER USER GET PROFILE

// const createProfile = async (req, res) => {
//   let connection;

//   try {
//     const {
//       name,
//       email,
//       dob,
//       gender,
//       city,
//       state,
//       pin,
//       profile,
//       register_id
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email is required" });
//     }

//     if (!profile) {
//       return res.status(400).json({ success: false, message: "Profile type is required" });
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     let imagePath;

//     if (req.file) {
//       imagePath = await compressImage(req.file.path);
//     }

//     let query;
//     let values;

//     // ✅ CASE 1: image exists
//     if (imagePath) {
//       query = `
//         INSERT INTO information 
//         (name, email, dob, gender, city, state, pin, profile, register_id, image)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       values = [
//         name,
//         email,
//         dob,
//         gender,
//         city,
//         state,
//         pin,
//         profile,
//         register_id,
//         imagePath
//       ];
//     } 
//     // ✅ CASE 2: no image → remove column
//     else {
//       query = `
//         INSERT INTO information 
//         (name, email, dob, gender, city, state, pin, profile, register_id)
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       values = [
//         name,
//         email,
//         dob,
//         gender,
//         city,
//         state,
//         pin,
//         profile,
//         register_id
//       ];
//     }

//     await connection.execute(query, values);

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Profile Successfully Inserted"
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("Error:", err);
//     res.status(500).json({ message: "Server error" });
//   } finally {
//     if (connection) connection.release();
//   }
// };
const createProfile = async (req, res) => {
  let connection;

  try {
    let {
      name,
      email,
      dob,
      gender,
      city,
      state,
      pin,
      mobile,
      profile,
      register_id,
      breed,
      emergency_contact_mail,
     emergency_contact_number,
    } = req.body;

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Profile type is required",
      });
    }
    if(!emergency_contact_mail||!emergency_contact_number){
      return res.status(400).json({
        success: false,
        message: "Emergency contact is required",
      });
    }
    
    // ✅ DEFAULT SAFE HANDLER
    const safe = (val) => val ?? "";

    // 🔥 PROFILE LOGIC
    if (profile === "HUMAN") {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required for HUMAN profile",
        });
      }

      // ✅ VALIDATE MOBILE (10 digits)
      if (mobile && !/^\d{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Mobile must be 10 digits",
        });
      }

      // ✅ VALIDATE PIN (6 digits)
      if (pin && !/^\d{6}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: "PIN must be 6 digits",
        });
      }

      // keep all values as is (safe applied later)

    } else if (profile === "PET") {
      // email empty, others normal
      email = safe(breed);

      // ✅ VALIDATE MOBILE (10 digits)
      if (mobile && !/^\d{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Mobile must be 10 digits",
        });
      }

      // ✅ VALIDATE PIN (6 digits)
      if (pin && !/^\d{6}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: "PIN must be 6 digits",
        });
      }

    } else if (profile === "OTHER") {
      // only name + image
      email = "";
      dob = "";
      gender = "";
      city = "";
      state = "";
      pin = "";
      mobile = "";
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    let imagePath;

    if (req.file) {
      imagePath = await compressImage(req.file.path);
    }

    let query;
    let values;

    if (imagePath) {
      query = `
        INSERT INTO information 
        (name, email, dob, gender, city, state, pin, profile, register_id, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      values = [
        safe(name),
        safe(email),
        dob || null, // ✅ THIS FIX,
        safe(gender),
        safe(city),
        safe(state),
        safe(pin),
        safe(profile),
        safe(register_id),
        imagePath
      ];
    } else {
      query = `
        INSERT INTO information 
        (name, email, dob, gender, city, state, pin, profile, register_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      values = [
        safe(name),
        safe(email),
        dob || null, // ✅ THIS FIX,
        safe(gender),
        safe(city),
        safe(state),
        safe(pin),
        safe(profile),
        safe(register_id)
      ];
    }

    const[result]=await connection.execute(query, values);

    const information_id = result.insertId;

  

     await connection.execute(
      `INSERT INTO emergency_contact 
      (information_id, name, relation, mobile, email, status, status2)
      VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [
        information_id,
       safe(""), // or separate emergency name if you want
      safe(""),   // relation (optional for now
      safe(emergency_contact_number),
      safe(emergency_contact_mail),
      ]
    );
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Profile Successfully Inserted",
    });

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {}
    }

    console.error("Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  } finally {
    if (connection) connection.release();
  }
};

const editProfile = async (req, res) => {
  let connection;

  try {
    const { id } = req.params; // 🔥 profile id to update

    let {
      name,
      email,
      dob,
      phone,
      gender,
     hair_color,
      eye_color,
      height,
      weight,
      identity,
      blood_group,
      
      profile,
      register_id,
      breed
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: "Profile type is required",
      });
    }

    const safe = (val) => val ?? "";

    // 🔥 PROFILE LOGIC (same as create)
    if (profile === "HUMAN") {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required for HUMAN profile",
        });
      }
    } else if (profile === "PET") {
      email = safe(breed);
    } else if (profile === "OTHER") {
      email = "";
      dob = "";
      gender = "";
     
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ check if profile exists
    const [existing] = await connection.query(
      "SELECT id, image FROM information WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // let imagePath = existing[0].image;

    // // 🔥 if new image uploaded
    // if (req.file) {
    //   imagePath = await compressImage(req.file.path);
    // }

    // 🔥 UPDATE QUERY
    const query = `
      UPDATE information SET
        name = ?,
        email = ?,
        phone=?,
        dob = ?,
        gender = ?,
        hair_color = ?,
        eye_color = ?,
        height = ?,
        weight = ?,
        identity = ?,
        blood_group = ?,
        
        profile = ?
       
        
      WHERE id = ?
    `;

    const values = [
      safe(name),
      safe(email),
      safe(phone),
      safe(dob),
      safe(gender),
      safe(hair_color),
      safe(eye_color),
      safe(height),
      safe(weight),
      safe(identity),
      safe(blood_group),
      safe(profile),
    
      
      id,
    ];

    await connection.execute(query, values);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {}
    }

    console.error("Edit Profile Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  } finally {
    if (connection) connection.release();
  }
};
const editProfileImage = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ get old image
    const [profile] = await connection.query(
      `SELECT id, image FROM information WHERE id = ?`,
      [id]
    );

    if (!profile.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const oldImage = profile[0].image;

    // 🔥 compress new image
    const imagePath = await compressImage(req.file.path);

    // ✅ update DB
    await connection.query(
      `UPDATE information SET image = ? WHERE id = ?`,
      [imagePath, id]
    );

    // 🔥 DELETE OLD IMAGE (if exists)
    if (oldImage) {
      try {
        // convert DB path → actual path
        const filename = oldImage.split("/").pop();
        console.log("Filename:", filename);

        const oldFilePath = path.join(
          __dirname,
          "../uploads/user",    
          filename
        );
        console.log("Old file path:", oldFilePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.error("Error deleting old image:", err);
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: "Profile image updated successfully",
      image: imagePath,
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("Update Image Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const deleteIndividualProfile = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Profile id is required",
      });
    }

    connection = await db.getConnection();

    // ✅ Start transaction (VERY IMPORTANT)
    await connection.beginTransaction();

    // 1. Check if profile exists
    const [profile] = await connection.query(
      `SELECT id FROM information WHERE id = ?`,
      [id]
    );

    if (!profile.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // 2. Delete child tables first (avoid FK issues)
    await connection.query(`DELETE FROM allergies WHERE information_id = ?`, [id]);
    await connection.query(`DELETE FROM medicine WHERE information_id = ?`, [id]);
    await connection.query(`DELETE FROM health_insurance WHERE information_id = ?`, [id]);
    await connection.query(`DELETE FROM vital_medical WHERE information_id = ?`, [id]);
    await connection.query(`DELETE FROM emergency_contact WHERE information_id = ?`, [id]);

    // 3. Delete main profile
    await connection.query(`DELETE FROM information WHERE id = ?`, [id]);

    // ✅ Commit
    await connection.commit();

    return res.json({
      success: true,
      message: "Profile deleted successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Delete Profile Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const getAllProfilesByUser = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { register_id } = req.query;
    if(!register_id){
      return res.status(400).json({
        success: false,
        message: "Register id is required"
      });
    }
    const [results] = await connection.query("SELECT * FROM information WHERE register_id = ?", [register_id]);
    res.status(200).json(results);
  }
   
    
  catch (err) {
    console.error("Register Error:", err);
    //next(err);
  } finally {
    if (connection) connection.release();
  }
};
const editAddress = async (req, res) => {
  let connection;

  try {
    const { id } = req.params; // 🔥 information_id
    const { address, city, state, pin } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Information ID is required",
      });
    }

    const safe = (val) => val ?? "";

    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ Check if record exists
    const [existing] = await connection.query(
      "SELECT id FROM information WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // 🔥 UPDATE ONLY ADDRESS FIELDS
    await connection.query(
      `
      UPDATE information SET
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        pin = COALESCE(?, pin)
      WHERE id = ?
      `,
      [
        safe(address),
        safe(city),
        safe(state),
        safe(pin),
        id,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("Update Address Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });

  } finally {
    if (connection) connection.release();
  }
};


// ADD / UPDATE (UPSERT)
//  const saveAllergy = async (req, res) => {
//    let connection;

//   try {
//     const { information_id, name, notes } = req.body;
//     if(!information_id ){
//       return res.status(400).json({
//         success: false,
//         message: "Information ID   required"
//       });
//     }
//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [existing] = await connection.query(
//       "SELECT id FROM allergies WHERE information_id = ?",
//       [information_id]
//     );

//     if (existing.length > 0) {
//       // UPDATE
//       await connection.query(
//         "UPDATE allergies SET name=?, note=? WHERE information_id=?",
//         [safe(name), safe(notes), information_id]
//       );
//     } else {
//       // INSERT
//       await connection.query(
//         "INSERT INTO allergies (information_id, name, note, status) VALUES (?, ?, ?, 0)",
//         [information_id, safe(name), safe(notes)]
//       );
//     }
//     await connection.commit();

//     return res.json({ success: true, message: "Allergy saved" });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: err.message });
//   }finally {
//     if (connection) connection.release();
//   }
// };
//  const saveMedication = async (req, res) => {
//   let connection;
//   try {
//     const {
//       information_id,
//       medicine_name,
//       notes,
//       dosage,
//       dosage_unit,
//       frequency,
//       frequency_time,
//     } = req.body;

//       if (!information_id) {
//         return res.status(400).json({
//           success: false,
//           message: "Information ID is required",
//         });
//       }

//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [existing] = await connection.query(
//       "SELECT id FROM medication WHERE information_id = ?",
//       [information_id]
//     );

//     if (existing.length > 0) {
//       await connection.query(
//         `UPDATE medication 
//          SET name=?, notes=?, dosage=?, dosage_unit=?, frequency=?, frequency_time=?, status=0 
//          WHERE information_id=?`,
//         [safe(medicine_name), safe(notes), safe(dosage), safe(dosage_unit), safe(frequency), 
//           safe(frequency_time), information_id]
//       );
//     } else {
//       await connection.query(
//         `INSERT INTO medication 
//          (information_id, name, notes, dosage, dosage_unit, frequency, frequency_time, status) 
//          VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
//         [information_id, safe(medicine_name), safe(notes), safe(dosage), safe(dosage_unit), safe(frequency), safe(frequency_time)]
//       );
//     }
//     await connection.commit();
//     return res.json({ success: true, message: "Medication saved" });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }finally {
//     if (connection) connection.release();
//   }
// };
//  const saveInsurance = async (req, res) => {
//   let connection;
//   try {
//     const { information_id, insurance_name, insurance_notes } = req.body;
//     if (!information_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Information ID is required",
//       });
//     }
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const [existing] = await connection.query(
//       "SELECT id FROM health_insurance WHERE information_id=?",
//       [information_id]
//     );

//     if (existing.length > 0) {
//       await connection.query(
//         "UPDATE health_insurance SET name=?, note=?, status=0 WHERE information_id=?",
//         [safe(insurance_name), safe(insurance_notes), information_id]
//       );
//     } else {
//       await connection.query(
//         "INSERT INTO health_insurance (information_id, name, note, status) VALUES (?, ?, ?, 0)",
//         [information_id, safe(insurance_name), safe(insurance_notes)]
//       );
//     }

//     await connection.commit();
//     return res.json({ success: true });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }finally {
//     if (connection) connection.release();
//   }
// };
//  const saveCondition = async (req, res) => {
//   let connection;
//   try {
//     const { information_id, condition_name, notes } = req.body;
//     if (!information_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Information ID is required",
//       });
//     }
//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const [existing] = await connection.query(
//       "SELECT id FROM vital_medical WHERE information_id=?",
//       [information_id]
//     );

//     if (existing.length > 0) {
//       await connection.query(
//         "UPDATE vital_medical SET name=?, note=?, status=0 WHERE information_id=?",
//         [safe(condition_name), safe(notes), information_id]
//       );
//     } else {
//       await connection.query(
//         "INSERT INTO vital_medical (information_id, name, note, status) VALUES (?, ?, ?, 0)",
//         [information_id, safe(condition_name), safe(notes)]
//       );
//     }

//     await connection.commit();
//     return res.json({ success: true });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }finally {
//     if (connection) connection.release();
//   }
// };


const addEmergencyContact = async (req, res) => {
  let connection;
  try {
    const { information_id,  name, relation, mobile, email } = req.body;

    if (!information_id ) {
      return res.status(400).json({
        success: false,
        message: "information_id  required",
      });
    }

    // ✅ Validation based on profile
  

    connection = await db.getConnection();

    await connection.query(
      `INSERT INTO emergency_contact 
       (information_id,  name, relation, mobile, email, status, status2)
       VALUES (?,  ?, ?, ?, ?, 0,  0)`,
      [
        information_id,
        
        safe(name),
        safe(relation),
        safe(mobile),
        safe(email)
        
      ]
    );

    return res.json({
      success: true,
      message: "Emergency contact added",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
 

 
// ── EDIT ──────────────────────────────────────────────────────────────────────
const editEmergencyContact = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;
    const { name, relation, mobile, email } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction()

    // ✅ 1. Get existing data
    const [existing] = await connection.query(
      `SELECT email FROM emergency_contact WHERE id=?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const oldEmail = existing[0].email;

    // ✅ 2. Check if email changed
    let status2Update = "";

    if (email && email !== oldEmail) {
      status2Update = ", status2=0"; // reset verification
    }

    // ✅ 3. Update query
    const [result] = await connection.query(
      `UPDATE emergency_contact 
       SET name=?, relation=?, mobile=?, email=? ${status2Update}
       WHERE id=?`,
      [
        safe(name),
        safe(relation),
        safe(mobile),
        safe(email),
        id,
      ]
    );
    await connection.commit()
    return res.json({
      success: true,
      message: email !== oldEmail
        ? "Email changed, verification required again 🔁"
        : "Emergency contact updated",
    });

  } catch (err) {
    console.error(err);
     if (connection) await connection.rollback();
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const sendOtpToVerifyEnergencyContact = async (req, res) => {
  let connection;

  try {
    const { email } = req.body;
    if(!email){
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction()

    // ✅ Check email exists
    const [result] = await connection.query(
      `SELECT id FROM emergency_contact WHERE email=?`,
      [email]
    );

    if (result.length === 0) {
      await connection.rollback()
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // ✅ Save OTP
    await connection.query(
      `UPDATE emergency_contact SET otp=? WHERE email=?`,
      [otp, email]
    );

    // ✅ Nodemailer transporter (TAGWAY SMTP)
    const transporter = nodemailer.createTransport({
      host: "tagway.co.in",
      port: 465,
      secure: true,
      auth: {
        user: "noreply@tagway.co.in",
        pass: "Tagway@123",
      },
    });

    // ✅ Email template (same like PHP)
    const htmlTemplate = `
      <table width='569' border='1' cellpadding='10' cellspacing='0' style='font-family:Arial;'>
        <tr>
          <td colspan='4' align="center">
            <b>VERIFY YOUR EMAIL</b>
          </td>
        </tr>
        <tr>
          <td>OTP</td>
          <td><strong>:</strong></td>
          <td>${otp}</td>
        </tr>
      </table>
    `;

    // ✅ Send mail
    await transporter.sendMail({
      from: '"TAGWAY" <noreply@tagway.co.in>',
      to: email,
      subject: "TAGWAY OTP Verification",
      html: htmlTemplate,
    });

    await connection.commit()
    return res.json({
      success: true,
      message: "OTP sent successfully 📩",
    });

  } catch (err) {
    console.error("MAIL ERROR:", err);
    if (connection) await connection.rollback();
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP ❌",
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
const verifyOtpEmergencyContact = async (req, res) => {
  let connection;

  try {
    const { email, otp } = req.body;
    if(!email || !otp){
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction()

    // ✅ Check if OTP matches
    const [result] = await connection.query(
      `SELECT id FROM emergency_contact WHERE email=? AND otp=?`,
      [email, otp]
    );

    if (result.length === 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        message: "Invalid OTP ❌",
      });
    }

    // ✅ Update status2 = 1 (verified)
    await connection.query(
      `UPDATE emergency_contact SET status2='1', otp=NULL WHERE email=?`,
      [email]
    );

    await connection.commit()
    return res.json({
      success: true,
      message: "Email verified successfully ✅",
    });

  } catch (err) {
    console.error(err);
    if (connection) await connection.rollback();
    return res.status(500).json({
      success: false,
      message: "Something went wrong ❌",
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
// const sendOtpToVerifyEnergencyContact = async (req, res) => {
//   let connection;

//   try {
//     const { email } = req.body;

//     connection = await db.getConnection();

//     // ✅ Check if email exists
//     const [result] = await connection.query(
//       `SELECT * FROM emergency_contact WHERE email=?`,
//       [email]
//     );

//     if (result.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Contact not found",
//       });
//     }

//     // ✅ Generate OTP (6 digit)
//     const otp = Math.floor(100000 + Math.random() * 900000);

//     // ✅ Save OTP in DB (add otp column if not exists)
//     await connection.query(
//       `UPDATE emergency_contact SET otp=? WHERE email=?`,
//       [otp, email]
//     );

//     // ✅ Setup transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "your_email@gmail.com",
//         pass: "your_app_password", // 🔥 NOT normal password
//       },
//     });

//     // ✅ Mail options
//     const mailOptions = {
//       from: "your_email@gmail.com",
//       to: email,
//       subject: "OTP Verification",
//       html: `
//         <h3>Your OTP for verification</h3>
//         <h2>${otp}</h2>
        
//       `,
//     };

//     // ✅ Send email
//     await transporter.sendMail(mailOptions);

//     return res.json({
//       success: true,
//       message: "OTP sent successfully 📩",
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };
// ── DELETE ────────────────────────────────────────────────────────────────────
const deleteEmergencyContact = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.getConnection();
    const [result] = await connection.query(
      `DELETE FROM emergency_contact WHERE id=?`, [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Contact not found" });
    return res.json({ success: true, message: "Emergency contact deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
const addAllergy = async (req, res) => {
  let connection;
  try {
    const { information_id, name, notes } = req.body;
    if (!information_id) return res.status(400).json({ success: false, message: "information_id required" });
 
    connection = await db.getConnection();
    await connection.query(
      "INSERT INTO allergies (information_id, name, note, status) VALUES (?, ?, ?, 0)",
      [information_id, safe(name), safe(notes)]
    );
    return res.json({ success: true, message: "Allergy added" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 

 
const editAllergy = async (req, res) => {
  let connection;
  try {
    const { id }             = req.params;          // allergy's own id
    const { name, notes }    = req.body;
    connection = await db.getConnection();
    const [result] = await connection.query(
      "UPDATE allergies SET name=?, note=? WHERE id=?",
      [safe(name), safe(notes), id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Allergy not found" });
    return res.json({ success: true, message: "Allergy updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
const deleteAllergy = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.getConnection();
    const [result] = await connection.query("DELETE FROM allergies WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Allergy not found" });
    return res.json({ success: true, message: "Allergy deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
// ══════════════════════════════════════════════════════════════════════════════
//  2. MEDICATIONS
// ══════════════════════════════════════════════════════════════════════════════
 
const addMedication = async (req, res) => {
  let connection;
  try {
    const {
      information_id, medicine_name, notes,
      dosage, dosage_unit, frequency, frequency_time,
    } = req.body;
    if (!information_id) return res.status(400).json({ success: false, message: "information_id required" });
 
    connection = await db.getConnection();
    await connection.query(
      `INSERT INTO medicine 
       (information_id, name, notes, dosage, dosage_unit, frequency, frequency_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [information_id, safe(medicine_name), safe(notes), safe(dosage),
       safe(dosage_unit), safe(frequency), safe(frequency_time)]
    );
    return res.json({ success: true, message: "Medication added" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
;
 
const editMedication = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      medicine_name, notes, dosage,
      dosage_unit, frequency, frequency_time,
    } = req.body;
    connection = await db.getConnection();
    const [result] = await connection.query(
      `UPDATE medicine 
       SET name=?, notes=?, dosage=?, dosage_unit=?, frequency=?, frequency_time=?
       WHERE id=?`,
      [safe(medicine_name), safe(notes), safe(dosage),
       safe(dosage_unit), safe(frequency), safe(frequency_time), id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Medication not found" });
    return res.json({ success: true, message: "Medication updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
const deleteMedication = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.getConnection();
    const [result] = await connection.query("DELETE FROM medicine WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Medication not found" });
    return res.json({ success: true, message: "Medication deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
// ══════════════════════════════════════════════════════════════════════════════
//  3. HEALTH INSURANCE
// ══════════════════════════════════════════════════════════════════════════════
 
const addInsurance = async (req, res) => {
  let connection;
  try {
    const { information_id, insurance_name, insurance_notes ,phone} = req.body;
    if (!information_id) return res.status(400).json({ success: false, message: "information_id required" });
 
    connection = await db.getConnection();
    await connection.query(
      "INSERT INTO health_insurance (information_id, name, note,phone, status) VALUES (?, ?, ?, ?, 0)",
      [information_id, safe(insurance_name), safe(insurance_notes),safe(phone)]
    );
    return res.json({ success: true, message: "Insurance added" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 

 
const editInsurance = async (req, res) => {
  let connection;
  try {
    const { id }                              = req.params;
    const { insurance_name, insurance_notes, phone } = req.body;
    connection = await db.getConnection();
    const [result] = await connection.query(
      "UPDATE health_insurance SET name=?, note=?, phone=? WHERE id=?",
      [safe(insurance_name), safe(insurance_notes), safe(phone), id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Insurance not found" });
    return res.json({ success: true, message: "Insurance updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
const deleteInsurance = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.getConnection();
    const [result] = await connection.query("DELETE FROM health_insurance WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Insurance not found" });
    return res.json({ success: true, message: "Insurance deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
// ══════════════════════════════════════════════════════════════════════════════
//  4. CONDITIONS  (vital_medical)
// ══════════════════════════════════════════════════════════════════════════════
 
const addCondition = async (req, res) => {
  let connection;
  try {
    const { information_id, condition_name, notes } = req.body;
    if (!information_id) return res.status(400).json({ success: false, message: "information_id required" });
 
    connection = await db.getConnection();
    await connection.beginTransaction();
    await connection.query(
      "INSERT INTO vital_medical (information_id, name, note, status) VALUES (?, ?, ?, 0)",
      [information_id, safe(condition_name), safe(notes)]
    );
    await connection.commit();

    return res.json({ success: true, message: "Condition added" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 

 
const editCondition = async (req, res) => {
  let connection;
  try {
    const { id }                       = req.params;
    const { condition_name, notes }    = req.body;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query(
      "UPDATE vital_medical SET name=?, note=? WHERE id=?",
      [safe(condition_name), safe(notes), id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Condition not found" });
      await connection.commit();
    return res.json({ success: true, message: "Condition updated" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
const deleteCondition = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query("DELETE FROM vital_medical WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Condition not found" });
    await connection.commit();
    return res.json({ success: true, message: "Condition deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
 
// const getIndividualProfileById = async (req, res) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { id } = req.params;
//     const [results] = await connection.query("SELECT * FROM information WHERE id = ?", [id]);
//     res.status(200).json({data: results[0]});
//   }
   
    
//   catch (err) {
//     console.error("Register Error:", err);
//     //next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getIndividualProfileById = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    // ── 1. Main profile info ────────────────────────────────────────────────
    // const [infoRows] = await connection.query(
    //   `SELECT i.*,DATE_FORMAT(i.date, '%Y-%m-%d') AS card_issue_date FROM information i WHERE i.id = ?`,
    //   [id]
    // );
const [infoRows] = await connection.query(
  `SELECT 
    i.id,
    i.image,
    i.name,
    i.phone,
    i.email,
    DATE_FORMAT(i.dob, '%Y-%m-%d') AS dob,
    i.gender,
    i.hair_color,
    i.eye_color,
    i.height,
    i.weight,
    i.blood_group,
    i.identity,
    i.address,
    i.city,
    i.state,
    i.pin,
    i.card_id,
    DATE_FORMAT(i.date, '%Y-%m-%d') AS card_issue_date,
    i.status2,
    i.register_id,
    i.status,
    i.profile,
    q.link,
   DATE_FORMAT(q.date3, '%Y-%m-%d') AS date3
  FROM information i
  LEFT JOIN new_qr q ON q.code = i.card_id
  WHERE i.id = ?`,
  [id]
);

    if (!infoRows.length) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const data = infoRows[0];
    const isOther = data.profile === "OTHER";
    console.log("Profile type:", data.profile);
    // ── 2. Emergency Contacts (ALWAYS FETCH) ────────────────────────────────
    const [emergencyRows] = await connection.query(
      `SELECT 
         e.id,
         e.name,
         e.relation,
         e.mobile,
         e.email,
         e.status,
         e.status2
       FROM emergency_contact e
       WHERE e.information_id = ?
       ORDER BY e.id DESC`,
      [id]
    );

    // ── 3. Conditional Fetch (ONLY if not OTHER) ────────────────────────────
    let allergyRows = [];
    let medicationRows = [];
    let insuranceRows = [];
    let conditionRows = [];

    if (!isOther) {
      // run in parallel 🚀
      const [
        [allergy],
        [medication],
        [insurance],
        [condition]
      ] = await Promise.all([
        connection.query(
          `SELECT 
             a.id,
             a.name  AS allergy_name,
             a.note  AS allergy_notes,
             a.status
           FROM allergies a
           WHERE a.information_id = ?
           ORDER BY a.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             m.id,
             m.name           AS medicine_name,
             m.notes          AS medicine_notes,
             m.dosage,
             m.dosage_unit,
             m.frequency,
             m.frequency_time,
             m.status
           FROM medicine m
           WHERE m.information_id = ?
           ORDER BY m.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             h.id,
             h.name  AS insurance_name,
             h.note  AS insurance_notes,
             h.phone AS insurance_phone,
             h.status
           FROM health_insurance h
           WHERE h.information_id = ?
           ORDER BY h.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             v.id,
             v.name  AS condition_name,
             v.note  AS condition_notes,
             v.status
           FROM vital_medical v
           WHERE v.information_id = ?
           ORDER BY v.id DESC`,
          [id]
        )
      ]);

      allergyRows = allergy;
      medicationRows = medication;
      insuranceRows = insurance;
      conditionRows = condition;
    }

    // ── 4. Build response ───────────────────────────────────────────────────
    const response = {
      ...data,

      // only filled if not OTHER
      allergy: allergyRows,
      medication: medicationRows,
      insurance: insuranceRows,
      condition: conditionRows,

      // always present
      emergency_contact: emergencyRows,
    };

    return res.status(200).json({ data: response });

  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
const getIndividualProfileByTagId = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { tagId } = req.params;
    if (!tagId) {
      return res.status(400).json({ success: false, message: "Tag ID is required" });
    }

    const [information]= await connection.query(
      `SELECT id FROM information WHERE card_id = ?`,
      [tagId]
    );
    if(information.length === 0){
      return res.status(404).json({ success: false, message: "Card Id not linked to any profile or profile not found" });
    }
    const { id } = information[0];

    // ── 1. Main profile info ────────────────────────────────────────────────
    // const [infoRows] = await connection.query(
    //   `SELECT i.*,DATE_FORMAT(i.date, '%Y-%m-%d') AS card_issue_date FROM information i WHERE i.id = ?`,
    //   [id]
    // );
const [infoRows] = await connection.query(
  `SELECT 
    i.id,
    i.image,
    i.name,
    i.phone,
    i.email,
    DATE_FORMAT(i.dob, '%Y-%m-%d') AS dob,
    i.gender,
    i.hair_color,
    i.eye_color,
    i.height,
    i.weight,
    i.blood_group,
    i.identity,
    i.address,
    i.city,
    i.state,
    i.pin,
    i.card_id,
    DATE_FORMAT(i.date, '%Y-%m-%d') AS card_issue_date,
    i.status2,
    i.register_id,
    i.status,
    i.profile,
    q.link   -- 👈 ADD THIS
  FROM information i
  LEFT JOIN new_qr q ON q.code = i.card_id
  WHERE i.id = ?`,
  [id]
);

    if (!infoRows.length) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const data = infoRows[0];
    const isOther = data.profile === "OTHER";
    console.log("Profile type:", data.profile);
    // ── 2. Emergency Contacts (ALWAYS FETCH) ────────────────────────────────
    const [emergencyRows] = await connection.query(
      `SELECT 
         e.id,
         e.name,
         e.relation,
         e.mobile,
         e.email,
         e.status,
         e.status2
       FROM emergency_contact e
       WHERE e.information_id = ?
       ORDER BY e.id DESC`,
      [id]
    );

    // ── 3. Conditional Fetch (ONLY if not OTHER) ────────────────────────────
    let allergyRows = [];
    let medicationRows = [];
    let insuranceRows = [];
    let conditionRows = [];

    if (!isOther) {
      // run in parallel 🚀
      const [
        [allergy],
        [medication],
        [insurance],
        [condition]
      ] = await Promise.all([
        connection.query(
          `SELECT 
             a.id,
             a.name  AS allergy_name,
             a.note  AS allergy_notes,
             a.status
           FROM allergies a
           WHERE a.information_id = ?
           ORDER BY a.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             m.id,
             m.name           AS medicine_name,
             m.notes          AS medicine_notes,
             m.dosage,
             m.dosage_unit,
             m.frequency,
             m.frequency_time,
             m.status
           FROM medicine m
           WHERE m.information_id = ?
           ORDER BY m.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             h.id,
             h.name  AS insurance_name,
             h.note  AS insurance_notes,
             h.phone AS insurance_phone,
             h.status
           FROM health_insurance h
           WHERE h.information_id = ?
           ORDER BY h.id DESC`,
          [id]
        ),
        connection.query(
          `SELECT 
             v.id,
             v.name  AS condition_name,
             v.note  AS condition_notes,
             v.status
           FROM vital_medical v
           WHERE v.information_id = ?
           ORDER BY v.id DESC`,
          [id]
        )
      ]);

      allergyRows = allergy;
      medicationRows = medication;
      insuranceRows = insurance;
      conditionRows = condition;
    }

    // ── 4. Build response ───────────────────────────────────────────────────
    const response = {
      ...data,

      // only filled if not OTHER
      allergy: allergyRows,
      medication: medicationRows,
      insurance: insuranceRows,
      condition: conditionRows,

      // always present
      emergency_contact: emergencyRows,
    };

    return res.status(200).json({success:true, data: response });

  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// const getIndividualProfileByQRCode = async (req, res) => {
//   let connection;
//   try {
//     const { code } = req.params;

//     if (!code) {
//       return res.status(400).json({
//         success: false,
//         message: "QR code is required",
//       });
//     }

//     connection = await db.getConnection();

//     // 🔥 1. find QR
//     const [qrRows] = await connection.query(
//       "SELECT * FROM new_qr WHERE code = ?",
//       [code]
//     );

//     if (!qrRows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "QR code not found",
//       });
//     }

//     const qr = qrRows[0];

//     // 🔥 2. find linked information (ONLY status = 0)
//     const [infoRows] = await connection.query(
//       "SELECT * FROM information WHERE card_id = ? AND status = 0",
//       [code]
//     );

//     if (!infoRows.length) {
//       return res.status(403).json({
//         success: false,
//         message: "This profile is not available / hidden",
//       });
//     }

//     const info = infoRows[0];
//     const infoId = info.id;

//     // 🔥 3. fetch all related data

//     const [allergyRows] = await connection.query(
//       `SELECT id, name AS allergy_name, note AS allergy_notes, status
//        FROM allergies 
//        WHERE information_id = ? 
//        ORDER BY id DESC`,
//       [infoId]
//     );

//     const [medicationRows] = await connection.query(
//       `SELECT id, name AS medicine_name, notes AS medicine_notes,
//               dosage, dosage_unit, frequency, frequency_time, status
//        FROM medicine 
//        WHERE information_id = ? 
//        ORDER BY id DESC`,
//       [infoId]
//     );

//     const [insuranceRows] = await connection.query(
//       `SELECT id, name AS insurance_name, note AS insurance_notes,
//               phone AS insurance_phone, status
//        FROM health_insurance 
//        WHERE information_id = ? 
//        ORDER BY id DESC`,
//       [infoId]
//     );

//     const [conditionRows] = await connection.query(
//       `SELECT id, name AS condition_name, note AS condition_notes, status
//        FROM vital_medical 
//        WHERE information_id = ? 
//        ORDER BY id DESC`,
//       [infoId]
//     );

//     const [emergencyRows] = await connection.query(
//       `SELECT id, name, mobile, relation, email
//        FROM emergency_contact 
//        WHERE information_id = ? 
//        ORDER BY id DESC`,
//       [infoId]
//     );

//     // 🔥 FINAL RESPONSE
//     return res.status(200).json({
//       success: true,
//       data: {
//         ...info,
//         qr,
//         allergy: allergyRows,
//         medication: medicationRows,
//         insurance: insuranceRows,
//         condition: conditionRows,
//         emergency_contact: emergencyRows,
//       },
//     });

//   } catch (err) {
//     console.error("getProfileByQRCode error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });

//   } finally {
//     if (connection) connection.release();
//   }
// };
const linkProductToQR = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔥 CHECK: already linked
    const [existing] = await connection.query(
      `SELECT card_id FROM information WHERE card_id = ?`,
      [code]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This QR is already linked to another profile",
      });
    }

    // 🔥 GET QR DATE FIRST
    const [qrData] = await connection.query(
      `SELECT date1 FROM new_qr WHERE code = ?`,
      [code]
    );

    if (qrData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }

    const qrDate = qrData[0].date1; // ✅ correct date

    // ✅ update QR status
    const [result] = await connection.query(
      `UPDATE new_qr SET status = 1 WHERE code = ?`,
      [code]
    );

    // ✅ update information table with date
    const [updateInformation] = await connection.query(
      `UPDATE information SET card_id = ?, date = ? WHERE id = ?`,
      [code, qrDate, id]
    );

    if (updateInformation.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Information not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR linked successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "This QR is already linked",
      });
    }

    console.error("linkProductQR error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

const getIndividualProfileByQRCode = async (req, res) => {
  let connection;
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    connection = await db.getConnection();

    // 1. QR
    const [qrRows] = await connection.query(
      "SELECT * FROM new_qr WHERE code = ?  ",
      [code]
    );

    if (!qrRows.length) {
      return res.status(404).json({
        success: false,
        message: "QR code not found ",
      });
    }
const status = Number(qrRows[0].status);
    if(status === 2){
      return res.status(404).json({
        success: false,
        message: "QR code expired ",
      });
    }

    

    const qr = qrRows[0];

    // 🔥 2. Info (NO status filter)
    const [infoRows] = await connection.query(
      `SELECT 
          i.id,
    i.image,
    i.name,
    i.phone,
    i.email,
    DATE_FORMAT(i.dob, '%Y-%m-%d') AS dob,
    i.gender,
    i.hair_color,
    i.eye_color,
    i.height,
    i.weight,
    i.blood_group,
    i.identity,
    i.address,
    i.city,
    i.state,
    i.pin,
    i.card_id,
    DATE_FORMAT(i.date, '%Y-%m-%d') AS card_issue_date,
    i.status2,
    i.register_id,
    i.status,
    i.profile
       FROM information i WHERE card_id = ?`,
      [code]
    );

    if (!infoRows.length) {
      return res.status(404).json({
        success: false,
        message: "No profile linked to this QR",
      });
    }

    const info = infoRows[0];
    const infoId = info.id;

    // 🔥 3. Parallel fetch
    const [
      allergyRows,
      medicationRows,
      insuranceRows,
      conditionRows,
      emergencyRows,
    ] = await Promise.all([
      connection.query(
        `SELECT id, name AS allergy_name, note AS allergy_notes
         FROM allergies WHERE information_id = ? AND status = 0 ORDER BY id DESC`,
        [infoId]
      ),
      connection.query(
        `SELECT id, name AS medicine_name, notes AS medicine_notes,
                dosage, dosage_unit, frequency, frequency_time
         FROM medicine WHERE information_id = ? AND status = 0 ORDER BY id DESC`,
        [infoId]
      ),
      connection.query(
        `SELECT id, name AS insurance_name, note AS insurance_notes,
                phone AS insurance_phone
         FROM health_insurance WHERE information_id = ? AND status = 0 ORDER BY id DESC`,
        [infoId]
      ),
      connection.query(
        `SELECT id, name AS condition_name, note AS condition_notes
         FROM vital_medical WHERE information_id = ? AND status = 0 ORDER BY id DESC`,
        [infoId]
      ),
      // ✅ NO status filter
      connection.query(
        `SELECT id, name, mobile, relation, email
         FROM emergency_contact WHERE information_id = ? ORDER BY id DESC`,
        [infoId]
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...info,
        qr,
        allergy: allergyRows[0],
        medication: medicationRows[0],
        insurance: insuranceRows[0],
        condition: conditionRows[0],
        emergency_contact: emergencyRows[0],
      },
    });

  } catch (err) {
    console.error("getProfileByQRCode error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
// const getIndividualProfileByQRCode = async (req, res) => {
//   let connection;
//   try {
//     const { code } = req.params;
//     if(!code){
//       return res.status(400).json({ success: false, message: "QR code is required" });
//     }
//     connection = await db.getConnection();

//     // 1. find the QR row
//     const [qrRows] = await connection.query(
//       "SELECT * FROM new_qr WHERE code = ?", [code]
//     );
//     if (!qrRows.length) {
//       return res.status(404).json({ success: false, message: "QR code not found" });
//     }

//     const qr = qrRows[0];

//     // 2. find the information row linked to this QR code
//     const [infoRows] = await connection.query(
//       "SELECT * FROM information WHERE card_id = ? AND status = 0", [code]
//     );
//     if (!infoRows.length) {
//       return res.status(404).json({ success: false, message: "No profile linked to this QR" });
//     }

//     const info = infoRows[0];
//     const infoId = info.id;

//     // 3. fetch all sub-data (same as getIndividualProfileById)
//     const [allergyRows] = await connection.query(
//       `SELECT id, name AS allergy_name, note AS allergy_notes, status
//        FROM allergies WHERE information_id = ? AND status = 0 ORDER BY id DESC`, [infoId]
//     );

//     const [medicationRows] = await connection.query(
//       `SELECT id, name AS medicine_name, notes AS medicine_notes,
//               dosage, dosage_unit, frequency, frequency_time, status
//        FROM medicine WHERE information_id = ? AND status = 0 ORDER BY id DESC`, [infoId]
//     );

//     const [insuranceRows] = await connection.query(
//       `SELECT id, name AS insurance_name, note AS insurance_notes,
//               phone AS insurance_phone, status
//        FROM health_insurance WHERE information_id = ? AND status = 0 ORDER BY id DESC`, [infoId]
//     );

//     const [conditionRows] = await connection.query(
//       `SELECT id, name AS condition_name, note AS condition_notes, status
//        FROM vital_medical WHERE information_id = ? AND status = 0 ORDER BY id DESC`, [infoId]
//     );

//     const [emergencyRows] = await connection.query(
//       `SELECT id, name, mobile, relation, email
//        FROM emergency_contact WHERE information_id = ? ORDER BY id DESC`, [infoId]
//     );

//     return res.status(200).json({
//       success: true,
//       data: {
//         ...info,
//         qr,
//         allergy:           allergyRows,
//         medication:        medicationRows,
//         insurance:         insuranceRows,
//         condition:         conditionRows,
//         emergency_contact: emergencyRows,
//       },
//     });

//   } catch (err) {
//     console.error("getProfileByQRCode error:", err);
//     return res.status(500).json({ success: false, error: err.message });
//   } finally {
//     if (connection) connection.release();
//   }
// };
const unlinkProductFromQR = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // ✅ CHECK: linked to THIS profile
    const [existing] = await connection.query(
      `SELECT card_id FROM information WHERE id = ? AND card_id = ?`,
      [id, code]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This QR is not linked to this profile",
      });
    }

    // ✅ update QR status
    const [result] = await connection.query(
      `UPDATE new_qr SET status = 0 WHERE code = ?`,
      [code]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }

    // ✅ update information
    const [updateInformation] = await connection.query(
      `UPDATE information SET card_id = NULL, date = NULL WHERE id = ?`,
      [id]
    );

    if (updateInformation.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Information not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR unlinked successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback(); // 🔥 important

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
// const unlinkProductFromQR = async (req, res) => {
//   let connection;
//   try {
//     const { id } = req.params;
//     const { code } = req.body;

//     if (!code) {
//       return res.status(400).json({
//         success: false,
//         message: "Code is required",
//       });
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // 🔥 CHECK: already linked
//    const [existing] = await connection.query(
//   `SELECT card_id FROM information WHERE id = ? AND card_id = ?`,
//   [id, code]
// );

//     if (existing.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "This QR is not linked to any profile",
//       });
//     }

//     // ✅ update QR status
//     const [result] = await connection.query(
//       `UPDATE new_qr SET status = 0 WHERE code = ?`,
//       [code]
//     );
// if (result.affectedRows === 0) {
//   await connection.rollback();
//   return res.status(404).json({
//     success: false,
//     message: "QR not found",
//   });
// }
//     // ✅ update information table with date
//     const [updateInformation] = await connection.query(
//       `UPDATE information SET card_id = ?,date = ? WHERE id = ?`,
//       [null, null, id]
//     );

//     if (updateInformation.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Information not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json(
//       {
//         success: true,
//         message: "QR unlinked successfully",
//       })

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// }
// const linkProductToQR = async (req, res) => {
//   let connection;
//   try {
//     const { id } = req.params;
//     const { code } = req.body;

//     if (!code) {
//       return res.status(400).json({
//         success: false,
//         message: "Code is required",
//       });
//     }

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // 🔥 CHECK: already linked?
//     const [existing] = await connection.query(
//       `SELECT id FROM information WHERE card_id = ?`,
//       [code]
//     );

//     if (existing.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "This QR is already linked to another profile",
//       });
//     }

//     // ✅ update QR table
//     const [result] = await connection.query(
//       `UPDATE new_qr SET status = 1 WHERE code = ?`,
//       [code]
//     );

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "QR not found",
//       });
//     }

//     // ✅ update information table
//     const [updateInformation] = await connection.query(
//       `UPDATE information SET card_id = ?,date=? WHERE id = ?`,
//       [code, result[0].date1, id]
//     );

//     if (updateInformation.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Information not found",
//       });
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "QR linked successfully",
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();

//     // 🔥 Handle duplicate key error (MySQL)
//     if (err.code === "ER_DUP_ENTRY") {
//       return res.status(400).json({
//         success: false,
//         message: "This QR is already linked (duplicate not allowed)",
//       });
//     }

//     console.error("linkProductQR error:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };


const updateViewOrHideData = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔥 1. Get current status from information table
    const [rows] = await connection.query(
      `SELECT status FROM information WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const currentStatus = rows[0].status;
    console.log("currentStatus:", currentStatus);

    // 🔁 2. Toggle status
    const newStatus = currentStatus == 1 ? 0 : 1;

    // 🔥 3. Update
    // await connection.query(
    //   `UPDATE information SET status = ? WHERE id = ?`,
    //   [newStatus, id]
    // );

    // await connection.query(
    //   `UPDATE allergies SET status = ? WHERE information_id = ?`,
    //   [newStatus, id]
    // );
    // await connection.query(
    //   `UPDATE vital_medical SET status = ? WHERE information_id = ?`,
    //   [newStatus, id]
    // );

    // await connection.query(
    //   `UPDATE medicine SET status = ? WHERE information_id = ?`,
    //   [newStatus, id]
    // );

    // await connection.query(
    //   `UPDATE health_insurance SET status = ? WHERE information_id = ?`,
    //   [newStatus, id]
    // );

    // 2. Run updates in parallel
    await Promise.all([

      connection.query(
        `UPDATE information SET status = ? WHERE id = ?`,
        [newStatus, id]
      ),
     
      connection.query(
        `UPDATE allergies SET status = ? WHERE information_id = ?`,
        [newStatus, id]
      ),
      connection.query(
        `UPDATE vital_medical SET status = ? WHERE information_id = ?`,
        [newStatus, id]
      ),
      connection.query(
        `UPDATE medicine SET status = ? WHERE information_id = ?`,
        [newStatus, id]
      ),
      connection.query(
        `UPDATE health_insurance SET status = ? WHERE information_id = ?`,
        [newStatus, id]
      ),

    ]);

    await connection.commit(); // ✅ SUCCESS

    return res.json({
      success: true,
      message: `Status updated to ${newStatus === 1 ? "Visible" : "Hidden"} ✅`,
      status: newStatus,
    });

  } catch (err) {
    console.error("updateViewOrHideData error:", err);
    if(connection) await connection.rollback();
    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};


const getEmergencyContactEmail = async (req, res) => {
    let connection;
  try {
     const { code } = req.params;
      console.log("code:", code);
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id FROM information WHERE card_id = ?`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const informationId = rows[0].id;

    const [email] = await connection.query(
      `SELECT email FROM emergency_contact WHERE information_id = ?`,
      [informationId]
    );
    if (!email.length) {
  return res.status(404).json({
    success: false,
    message: "Emergency contact not found",
  });
}
    console.log("email:", email);

    await connection.commit();
    return res.json({ success: true, email: email[0].email });
  } catch (err) {
    console.error("getEmergencyContactEmail error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }finally {
    if (connection) connection.release();
  }
};

const sendLocationMail = async (req, res) => {
  try {
    const { email, locationLink } = req.body;


    



    if (!email || !locationLink) {
      return res.status(400).json({
        success: false,
        message: "Email and location required",
      });
    }

    const transporter = nodemailer.createTransport({
      host: "tagway.co.in",
      port: 465,
      secure: true,
      auth: {
        user: "noreply@tagway.co.in",
        pass: "Tagway@123",
      },
    });

    const htmlTemplate = `
      <div style="font-family: Arial;">
        <h3>🚨 Emergency Location Alert</h3>
        <p>Someone scanned your QR code and shared their live location.</p>
        

        <a href="${locationLink}" target="_blank" 
           style="padding:10px 15px; background:#007bff; color:#fff; text-decoration:none;">
          📍 View Location
        </a>

        <p style="margin-top:10px;">
          Or copy this link:<br/>
          ${locationLink}
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: '"TAGWAY" <noreply@tagway.co.in>',
      to: email,
      subject: "🚨 Emergency Location",
      html: htmlTemplate,
    });

    return res.json({
      success: true,
      message: "Location sent successfully",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to send location",
    });
  }
};
export { createProfile, editProfile,editProfileImage, deleteIndividualProfile, editAddress, getAllProfilesByUser, getIndividualProfileById
  , addCondition, editCondition, deleteCondition, addAllergy, editAllergy, deleteAllergy
  , addInsurance, editInsurance, deleteInsurance, addMedication, editMedication, deleteMedication
  , addEmergencyContact, editEmergencyContact, deleteEmergencyContact, linkProductToQR,unlinkProductFromQR,
   getIndividualProfileByQRCode,getIndividualProfileByTagId, updateViewOrHideData,sendOtpToVerifyEnergencyContact,
   verifyOtpEmergencyContact,getEmergencyContactEmail,sendLocationMail
 };
//  const getIndividualProfileById = async (req, res) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { id } = req.params;

//     // ── 1. Main profile info ──────────────────────────────────────────────────
//     const [infoRows] = await connection.query(
//       `SELECT i.* FROM information i WHERE i.id = ?`,
//       [id]
//     );

//     if (!infoRows.length) {
//       return res.status(404).json({ success: false, message: "Profile not found" });
//     }

//     const data = infoRows[0];

//     // ── 2. All allergies for this information_id ──────────────────────────────
//     // Keeping your exact alias names: allergy_name, allergy_notes
//     const [allergyRows] = await connection.query(
//       `SELECT 
//          a.id,
//          a.name  AS allergy_name,
//          a.note  AS allergy_notes,
//          a.status
//        FROM allergies a
//        WHERE a.information_id = ?
//        ORDER BY a.id DESC`,
//       [id]
//     );

//     // ── 3. All medications for this information_id ────────────────────────────
//     // Keeping your exact alias names: medicine_name, medication_notes, dosage, dosage_unit, frequency, frequency_time
//     const [medicationRows] = await connection.query(
//       `SELECT 
//          m.id,
//          m.name           AS medicine_name,
//          m.notes          AS medicine_notes,
//          m.dosage,
//          m.dosage_unit,
//          m.frequency,
//          m.frequency_time,
//          m.status
//        FROM medicine m
//        WHERE m.information_id = ?
//        ORDER BY m.id DESC`,
//       [id]
//     );

//     // ── 4. All health insurances for this information_id ──────────────────────
//     // Keeping your exact alias names: insurance_name, insurance_notes
//     const [insuranceRows] = await connection.query(
//       `SELECT 
//          h.id,
//          h.name  AS insurance_name,
//          h.note  AS insurance_notes,
//          h.phone AS insurance_phone,
//          h.status
//        FROM health_insurance h
//        WHERE h.information_id = ?
//        ORDER BY h.id DESC`,
//       [id]
//     );

//     // ── 5. All conditions for this information_id ─────────────────────────────
//     // Keeping your exact alias names: condition_name, condition_notes
//     const [conditionRows] = await connection.query(
//       `SELECT 
//          v.id,
//          v.name  AS condition_name,
//          v.note  AS condition_notes,
//          v.status
//        FROM vital_medical v
//        WHERE v.information_id = ?
//        ORDER BY v.id DESC`,
//       [id]
//     );
//  // ── 6. Emergency Contacts (NEW 🔥) ──────────────────────────────────────
//     const [emergencyRows] = await connection.query(
//       `SELECT 
//          e.id,
         
//          e.name,
//          e.relation,
//          e.mobile,
//          e.email,
//          e.status,
//          e.status2
//        FROM emergency_contact e
//        WHERE e.information_id = ?
//        ORDER BY e.id DESC`,
//       [id]
//     );
//     // ── 6. Build response ─────────────────────────────────────────────────────
//     const response = {
//       ...data,

//       // array of all allergies (empty array if none)
//       allergy: allergyRows,

//       // array of all medications
//       medication: medicationRows,

//       // array of all insurances
//       insurance: insuranceRows,

//       // array of all conditions
//       condition: conditionRows,
//       // array of all emergency contacts
//       emergency_contact: emergencyRows,
//     };

//     return res.status(200).json({ data: response });

//   } catch (err) {
//     console.error("Get Profile Error:", err);
//     return res.status(500).json({ error: err.message });
//   } finally {
//     if (connection) connection.release();
//   }
// };