import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
// import { fileURLToPath } from "url";
import db from "../../config/db.js";

// 🔥 fix __dirname (ES module)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// 🔥 Generate 6-digit code using UUID
// ─────────────────────────────────────────────────────────────
const generate6DigitFromUUID = () => {
  const uuid = uuidv4().replace(/-/g, "");
  const num = parseInt(uuid.substring(0, 12), 16);
  return String(num).slice(0, 6);
};

// ─────────────────────────────────────────────────────────────
// 🔥 Ensure unique code
// ─────────────────────────────────────────────────────────────
const generateUniqueCode = async (connection) => {
  let code, exists;

  do {
    code = generate6DigitFromUUID();

    const [rows] = await connection.query(
      "SELECT id FROM new_qr WHERE code = ?",
      [code]
    );

    exists = rows.length > 0;

  } while (exists);

  return code;
};

// ─────────────────────────────────────────────────────────────
// 🔥 CREATE QR CONTROLLER
// ─────────────────────────────────────────────────────────────
const createQR = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    // ✅ 1. generate unique code
    const code = await generateUniqueCode(connection);

    // ✅ 2. encode code (for URL)
    const encodedCode = Buffer.from(code).toString("base64");

    // ✅ 3. React route (IMPORTANT FIX)
    const link = `http://localhost:5173/profile-details-qr/${encodedCode}`;

    // ✅ 4. ensure folder exists
    // const qrDir = path.join(__dirname, "../uploads/admin/qr");
    const qrDir = path.join(process.cwd(), "uploads/admin/qr");
    // const qrDir = path.join(process.cwd(), "uploads/admin/qr");
    //  const qrDir = path.join(process.cwd(), "backend/uploads/admin/qr");
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // ✅ 5. generate QR image
    const fileName = `${code}.png`;
    const filePath = path.join(qrDir, fileName);

    await QRCode.toFile(filePath, link, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // ✅ 6. store public path (IMPORTANT FIX)
    // const imageCol = `qr/${fileName}`;
    const imageCol = `admin/qr/${fileName}`;
    const today = new Date().toISOString().split("T")[0];

    // ✅ 7. insert into DB
    let result;

    try {
      // [result] = await connection.query(
      //   `INSERT INTO new_qr 
      //     (code, link, image, status, status2, deliver, date1, date2, date3)
      //    VALUES (?, ?, ?, '0', '', 0, ?, '', '')`,
      //   [code, link, imageCol, today]
      // );
      [result] = await connection.query(
        `INSERT INTO new_qr 
    (code, link, image, status, status2, deliver, date1, date2, date3)
   VALUES (?, ?, ?, '0', NULL, 0, ?, NULL, NULL)`,
        [code, link, imageCol, today]
      );

    } catch (err) {
      // 🔥 retry if duplicate
      if (err.code === "ER_DUP_ENTRY") {

        const newCode = await generateUniqueCode(connection);

        const encodedCode2 = Buffer.from(newCode).toString("base64");
        const newLink = `https://tagway.co.in/profile/${encodedCode2}`;

        const newFileName = `${newCode}.png`;
        const newFilePath = path.join(qrDir, newFileName);

        await QRCode.toFile(newFilePath, newLink);

        const newImageCol = `admin/qr/${newFileName}`;

        // [result] = await connection.query(
        //   `INSERT INTO new_qr 
        //     (code, link, image, status, status2, deliver, date1, date2, date3)
        //    VALUES (?, ?, ?, '0', '', 0, ?, '', '')`,
        //   [newCode, newLink, newImageCol, today]
        // );
        [result] = await connection.query(
          `INSERT INTO new_qr 
    (code, link, image, status, status2, deliver, date1, date2, date3)
   VALUES (?, ?, ?, '0', NULL, 0, ?, NULL, NULL)`,
          [newCode, newLink, newImageCol, today]
        );

        return res.status(201).json({
          success: true,
          message: "QR created (retry)",
          data: {
            id: result.insertId,
            code: newCode,
            link: newLink,
            image: newImageCol,
          },
        });
      }

      throw err;
    }

    // ✅ success response
    return res.status(201).json({
      success: true,
      message: "QR created successfully",
      data: {
        id: result.insertId,
        code,
        link,
        image: imageCol,
        status: "0",
        status2: "",
        deliver: 0,
        date1: today,
        date2: "0000-00-00",
        date3: "0000-00-00",
      },
    });

  } catch (err) {
    console.error("createQR error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};



const getAllQR = async (req, res) => {
  try {
    // query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    // 🔍 Search condition
    let searchQuery = "";
    let values = [];

    // if (search) {
    //   searchQuery = `
    //     WHERE code LIKE ? 
    //     OR status LIKE ? 
    //     OR DATE_FORMAT(date1, '%Y-%m-%d') LIKE ?

    //   `;
    //   values = [`%${search}%`, `%${search}%`, `%${search}%`];
    // }
    if (search) {
      searchQuery = `
    AND (
      code LIKE ? 
      OR status LIKE ? 
      OR DATE_FORMAT(date1, '%Y-%m-%d') LIKE ?
    )
  `;
      values = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // 📦 Main data query
    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(date1, '%Y-%m-%d') AS date1,
        DATE_FORMAT(date2, '%Y-%m-%d') AS date2,
        DATE_FORMAT(date3, '%Y-%m-%d') AS date3,
        id, code, link, image, status, status2, deliver
      FROM new_qr
      WHERE deliver=0
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // 🔢 Total count (for pagination)
    // const [countResult] = await db.query(
    //   `
    //   SELECT COUNT(*) as total
    //   FROM new_qr
    //   ${searchQuery}
    //   `,
    //   values
    // );
    const [countResult] = await db.query(
      `
  SELECT COUNT(*) as total
  FROM new_qr
  WHERE deliver = 0
  ${searchQuery}
  `,
      values
    );
    const total = countResult[0].total;

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,

        limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });

  } catch (err) {
    console.error("getAllQR error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


const printQR = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await db.query(`SELECT * FROM new_qr WHERE id = ?`, [id]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }
    const [result] = await connection.query(
      `UPDATE new_qr SET  deliver=deliver+1,date2 = NOW() WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: "Failed to update deliver count" });
    }

    await connection.commit();
    return res.status(200).json({ success: true, data: rows[0] });

  } catch (err) {
    console.error("printQR error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getAllPrintedQRs = async (req, res) => {
  try {
    // 🔥 query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    // 🔥 search condition
    let searchQuery = "";
    let params = [];

    if (search) {
      searchQuery = `
        AND (
          code LIKE ? OR 
          status LIKE ?
           OR DATE_FORMAT(date2, '%Y-%m-%d') LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // ✅ MAIN QUERY (paginated)
    const [rows] = await db.query(
      `SELECT 
        id,
        code,
        link,
        image,
        status,
        status2,
        deliver,
        DATE_FORMAT(date1, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(date2, '%Y-%m-%d') AS printed_date,
        DATE_FORMAT(date3, '%Y-%m-%d') AS delivered_date
      FROM new_qr
      WHERE date2 IS NOT NULL
      AND status2 IS NULL
      AND deliver=1
      ${searchQuery}
      ORDER BY date2 DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // ✅ COUNT QUERY
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM new_qr
       WHERE date2 IS NOT NULL
       AND status2 IS NULL
       AND deliver=1
       ${searchQuery}`,
      params
    );

    const total = countRows[0].total;

    return res.status(200).json({
      success: true,

      data: rows,
      pagination: {
        total,

        limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }
    });

  } catch (err) {
    console.error("getAllPrintedQRs error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const addQRTo1Year = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [id]
    );
    // const [rows] = await connection.query(`SELECT * FROM new_qr WHERE code = ?`, [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    } else if (rows[0].deliver === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "QR has not been printed yet" });
    }

    const [result] = await connection.query(
      `UPDATE new_qr SET status2=0, deliver=deliver+1, date3 = DATE_ADD(date2, INTERVAL 1 YEAR) WHERE code = ?`,
      [id]
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }
    await connection.commit();
    return res.status(200).json({ success: true, message: "QR added to 1 year" });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("addQRTo1Year error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
const getAll1YearQRs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let params = [];

    // if (search) {
    //   searchQuery = `AND (code LIKE ? OR status LIKE ? OR status2 LIKE ?)`;
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    // }
    if (search) {
      searchQuery = `
    AND (
      CAST(code AS CHAR) LIKE ? OR
      status LIKE ? OR
      status2 LIKE ? OR
      DATE_FORMAT(date1, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date2, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date3, '%Y-%m-%d') LIKE ?
    )
  `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    const [rows] = await db.query(
      `SELECT 
        id, code, link, image, status, status2, deliver,
        DATE_FORMAT(date1, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(date2, '%Y-%m-%d') AS printed_date,
        DATE_FORMAT(date3, '%Y-%m-%d') AS delivery_date
      FROM new_qr
      WHERE date2 IS NOT NULL
        AND date3 IS NOT NULL
        AND status2 = 0
        AND status != 2 
        ${searchQuery}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM new_qr
       WHERE date2 IS NOT NULL
         AND date3 IS NOT NULL
         AND status2 = 0
         AND status != 2 
         ${searchQuery}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0].total,
        limit,
        totalPages: Math.ceil(countRows[0].total / limit),
        currentPage: page,
      },
    });

  } catch (err) {
    console.error("1year error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
const addQRTo6Months = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // const [rows] = await connection.query(
    //   `SELECT * FROM new_qr WHERE code = ?`,
    //   [id]
    // );
    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    if (rows[0].deliver === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "QR has not been printed yet",
      });
    }

    const [result] = await connection.query(
      `UPDATE new_qr 
       SET status2=2, deliver=deliver+1, date3 = DATE_ADD(date2, INTERVAL 6 MONTH) 
       WHERE code = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR added to 6 months",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("addQRTo6Months error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
const getAll6MonthsQRs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let params = [];

    // if (search) {
    //   searchQuery = `AND (code LIKE ? OR status LIKE ? OR status2 LIKE ?)`;
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    // }
    if (search) {
  searchQuery = `
    AND (
      CAST(code AS CHAR) LIKE ? OR
      status LIKE ? OR
      status2 LIKE ? OR
      DATE_FORMAT(date1, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date2, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date3, '%Y-%m-%d') LIKE ?
    )
  `;

  params.push(
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`
  );
}

    const [rows] = await db.query(
      `SELECT 
        id, code, link, image, status, status2, deliver,
        DATE_FORMAT(date1, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(date2, '%Y-%m-%d') AS printed_date,
        DATE_FORMAT(date3, '%Y-%m-%d') AS delivery_date
      FROM new_qr
      WHERE date2 IS NOT NULL
        AND date3 IS NOT NULL
        AND status2 = 2
         AND status != 2   
        ${searchQuery}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM new_qr
       WHERE date2 IS NOT NULL
         AND date3 IS NOT NULL
         AND status2 = 2
         AND status != 2 
         ${searchQuery}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0].total,
        limit,
        totalPages: Math.ceil(countRows[0].total / limit),
        currentPage: page,
      },
    });

  } catch (err) {
    console.error("6month error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
const addQRTo3Months = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // const [rows] = await connection.query(
    //   `SELECT * FROM new_qr WHERE code = ?`,
    //   [id]
    // );
    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    if (rows[0].deliver === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "QR has not been printed yet",
      });
    }

    const [result] = await connection.query(
      `UPDATE new_qr 
       SET status2=1, deliver=deliver+1, date3 = DATE_ADD(date2, INTERVAL 3 MONTH) 
       WHERE code = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR added to 3 months",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("addQRTo3Months error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
const getAll3MonthsQRs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let params = [];

    // if (search) {
    //   searchQuery = `
    //     AND (code LIKE ? OR status LIKE ? OR status2 LIKE ?)
    //   `;
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    // }
    if (search) {
  searchQuery = `
    AND (
      CAST(code AS CHAR) LIKE ? OR
      status LIKE ? OR
      status2 LIKE ? OR
      DATE_FORMAT(date1, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date2, '%Y-%m-%d') LIKE ? OR
      DATE_FORMAT(date3, '%Y-%m-%d') LIKE ?
    )
  `;

  params.push(
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`
  );
}

    const [rows] = await db.query(
      `SELECT 
        id, code, link, image, status, status2, deliver,
        DATE_FORMAT(date1, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(date2, '%Y-%m-%d') AS printed_date,
        DATE_FORMAT(date3, '%Y-%m-%d') AS delivery_date
      FROM new_qr
      WHERE date2 IS NOT NULL 
        AND date3 IS NOT NULL
        AND status2 = 1
        AND status != 2 
        ${searchQuery}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM new_qr
       WHERE date2 IS NOT NULL 
         AND date3 IS NOT NULL
         AND status2 = 1
         AND status != 2 
         ${searchQuery}`,
      params
    );

    const total = countRows[0].total;

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });

  } catch (err) {
    console.error("getAll3MonthsQRs error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


const getAllExpiredQrs = async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let params = [];

    connection = await db.getConnection();

    if (search) {
      searchQuery = `AND code LIKE ?`;
      params.push(`%${search}%`);
    }

    const [rows] = await connection.query(
      `
      SELECT 
        id, code, link, image, status, status2, deliver,
        DATE_FORMAT(date1, '%Y-%m-%d') AS created_date,
        DATE_FORMAT(date2, '%Y-%m-%d') AS printed_date,
        DATE_FORMAT(date3, '%Y-%m-%d') AS delivery_date
      FROM new_qr
      WHERE date2 IS NOT NULL 
        
        AND status = 2
        ${searchQuery}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM new_qr
      WHERE date2 IS NOT NULL 
        
        AND status = 2
        ${searchQuery}
      `,
      params
    );

    const total = countRows[0].total;

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total,
        limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });

  } catch (err) {
    console.error("getAllExpiredQrs error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const renewQrTo1Year = async (req, res) => {
  let connection;
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({ success: false, message: "QrCode is required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();


    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [qrCode]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    // 🔥 Check if QR is linked (sold)
    const [soldQr] = await connection.query(
      `SELECT 1 FROM information WHERE card_id = ? LIMIT 1`,
      [qrCode]
    );

    const status = soldQr.length > 0 ? 1 : 0;


    const [result] = await connection.query(
      `UPDATE new_qr 
       SET status2=0,status=?, date3 = DATE_ADD(date2, INTERVAL 1 YEAR) 
       WHERE code = ?`,
      [status, qrCode]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "QR not found" });
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "QR renewed for 1 year",
    });




  } catch (err) {
    if (connection) await connection.rollback();
    console.error("renewQrTo1Year error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
}
const renewQrTo6Months = async (req, res) => {
  let connection;
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QrCode is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [qrCode]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }
    const [soldQr] = await connection.query(
      `SELECT 1 FROM information WHERE card_id = ? LIMIT 1`,
      [qrCode]
    );

    const status = soldQr.length > 0 ? 1 : 0;

    const [result] = await connection.query(
      `UPDATE new_qr SET status2 = 2, status = ?,date3 = DATE_ADD(date2, INTERVAL 6 MONTH)
       WHERE code = ?`,
      [status, qrCode]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR renewed for 6 months",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("renewQrTo6Months error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
const renewQrTo3Months = async (req, res) => {
  let connection;
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QrCode is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT * FROM new_qr WHERE code = ? FOR UPDATE`,
      [qrCode]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }
    const [soldQr] = await connection.query(
      `SELECT 1 FROM information WHERE card_id = ? LIMIT 1`,
      [qrCode]
    );

    const status = soldQr.length > 0 ? 1 : 0;

    const [result] = await connection.query(
      `UPDATE new_qr 
   SET status2 = 1, status = ?, date3 = DATE_ADD(date2, INTERVAL 3 MONTH)
   WHERE code = ?`,
      [status, qrCode]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "QR not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "QR renewed for 3 months",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("renewQrTo3Months error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};


export {
  createQR, getAllQR, printQR, getAllPrintedQRs, addQRTo1Year, addQRTo6Months, addQRTo3Months,
  getAll1YearQRs, getAll6MonthsQRs, getAll3MonthsQRs, getAllExpiredQrs, renewQrTo1Year, renewQrTo6Months, renewQrTo3Months
};