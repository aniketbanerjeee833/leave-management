import db from "../../config/db.js";

const getAllShipping = async (req, res) => {
  let connection;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    // 🔍 search by name, phone, address
    if (search) {
      searchQuery = `
        AND (
          name LIKE ?
          OR phone LIKE ?
          OR address LIKE ?
          OR city LIKE ?
         
        )
      `;
      values = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    connection = await db.getConnection();

    // 📦 main query
    const [rows] = await connection.query(
      `
      SELECT 
        id, name, phone, address, city, state, pin,
        DATE_FORMAT(date, '%Y-%m-%d %H:%i') AS date_fmt
      FROM shipping
      WHERE 1=1
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // 🔢 count query
    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM shipping
      WHERE 1=1
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
    console.error("getAllShipping error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET ALL PURCHASE — GET /api/shop/purchase/all ─────────────────────────────
const getAllPurchase = async (req, res) => {
  let connection;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    // 🔍 search by name, phone, address
    if (search) {
      searchQuery = `
        AND (
          name LIKE ?
          OR phone LIKE ?
          OR address LIKE ?
          OR price LIKE ?
        )
      `;
      values = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    connection = await db.getConnection();

    // 📦 main query
    const [rows] = await connection.query(
      `
      SELECT 
        id, name, phone, address,price,status,
        DATE_FORMAT(date, '%Y-%m-%d %H:%i') AS date
      FROM purchase
      WHERE 1=1
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // 🔢 count query
    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM purchase
      WHERE 1=1
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
    console.error("getAllPurchase error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

const updatePurchaseStatus = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
  
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();

    const[result]=await connection.query("SELECT * FROM purchase WHERE id = ?", [ id]);
    if(result.length === 0){
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    await connection.query("UPDATE purchase SET status = 1 WHERE id = ?", [ id]);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Purchase status updated" });
  } catch (err) {
    console.error("updatePurchaseStatus error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
export { getAllShipping, getAllPurchase, updatePurchaseStatus };