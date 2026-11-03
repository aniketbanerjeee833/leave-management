import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
// ── helpers ──────────────────────────────────────────────────────────────────
// const generateUniqueInId = async (connection) => {
//   let inId, exists;
//   do {
//     inId = String(Math.floor(10000 + Math.random() * 90000)); // 5-digit
//     const [rows] = await connection.query(
//       "SELECT id FROM shipping WHERE in_id = ?", [inId]
//     );
//     exists = rows.length > 0;
//   } while (exists);
//   return inId;
// };
const generate5DigitFromUUID = () => {
  const uuid = uuidv4().replace(/-/g, "");
  const num = parseInt(uuid.substring(0, 12), 16);
  return String(num).slice(0, 5);
};
// ── ADD SHIPPING — POST /api/shop/shipping/add ────────────────────────────────
const addShipping = async (req, res) => {
  let connection;
  try {
    const { name, phone, company, address, apartment, city, state, pin } = req.body;

    if (!name || !phone || !address || !city || !state || !pin) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const in_id = await generate5DigitFromUUID(connection);

    const [result] = await connection.query(
      `INSERT INTO shipping (name, phone, company, address, apartment, city, state, pin, in_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, phone, company || "", address, apartment || "", city, state, pin, in_id]
    );
    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Shipping added",
      data: {
        id:      result.insertId,
        in_id,
        name, phone, company, address, apartment, city, state, pin,
      },
    });
  } catch (err) {
    console.error("addShipping error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ── ADD PURCHASE — POST /api/shop/purchase/add ────────────────────────────────
const addPurchase = async (req, res) => {
  let connection;
  try {
    const { name, phone, address, price } = req.body;

    if (!name || !phone || !address || !price) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO purchase (name, phone, address, price, status)
       VALUES (?, ?, ?, ?,NULL)`,
      [name, phone, address, price]
    );
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Purchase recorded",
      data: { id: result.insertId, name, phone, address, price },
    });
  } catch (err) {
    console.error("addPurchase error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET ALL SHIPPING — GET /api/shop/shipping/all ─────────────────────────────
// const getAllShipping = async (req, res) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const [rows] = await connection.query(
//       `SELECT *, DATE_FORMAT(date, '%Y-%m-%d %H:%i') AS date_fmt
//        FROM shipping ORDER BY id DESC`
//     );
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   } finally {
//     if (connection) connection.release();
//   }
// };

// // ── GET ALL PURCHASE — GET /api/shop/purchase/all ─────────────────────────────
// const getAllPurchase = async (req, res) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const [rows] = await connection.query(
//       `SELECT *, DATE_FORMAT(date, '%Y-%m-%d %H:%i') AS date_fmt
//        FROM purchase ORDER BY id DESC`
//     );
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   } finally {
//     if (connection) connection.release();
//   }
// };

// ── GET SHIPPING BY in_id — GET /api/shop/shipping/:inId ─────────────────────
const getShippingByInId = async (req, res) => {
  let connection;
  try {
    const { inId } = req.params;
    if (!inId) {
      return res.status(400).json({ success: false, message: "inId is required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT * FROM shipping WHERE in_id = ?", [inId]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Shipping not found" });
    }
    await connection.commit();
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
export { addShipping, addPurchase, getShippingByInId };
// module.exports = { addShipping, addPurchase, getAllShipping, getAllPurchase, getShippingByInId };