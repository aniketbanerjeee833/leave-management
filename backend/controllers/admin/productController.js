// const db      = require("../config/db");
// const path    = require("path");
// const fs      = require("fs");
// const multer  = require("multer");

// // ── multer setup for product images ──────────────────────────────────────────
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = path.join(process.cwd(), "uploads/admin/products");
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
//   },
// });
// export const upload = multer({ storage });

// ── ADD PRODUCT — POST /api/product/add ──────────────────────────────────────
import db from "../../config/db.js";
import compressProductImage from "../../utils/productImageCompressor.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 const addProduct = async (req, res) => {
  let connection;

  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    let imagePath = "";

    // ✅ If image uploaded → compress it
    if (req.file) {
      imagePath = await compressProductImage(req.file.path, "admin/products");
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO product (name, price, image, un)
       VALUES (?, ?, ?, ?)`,
      [name, price, imagePath,  "1"]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: {
        id: result.insertId,
        name,
        price,
        image: imagePath
      },
    });

  } catch (err) {
    console.error("addProduct error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET ALL PRODUCTS — GET /api/product/all ───────────────────────────────────
 const getAllProducts = async (req, res) => {
  try {
    // query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    // 🔍 search condition
    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `
        AND (
          name LIKE ? 
          OR price LIKE ?
        )
      `;
      values = [`%${search}%`, `%${search}%`];
    }

    // 📦 main query
    const [rows] = await db.query(
      `
      SELECT id, name, price, image, un
      FROM product
      WHERE 1=1
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    // 🔢 count query
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM product
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
    console.error("getAllProducts error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
const editProduct = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;
    const { name, price } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔍 Get existing product
    const [rows] = await connection.query(
      "SELECT * FROM product WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let imagePath = rows[0].image;

    // ✅ If new image uploaded
    if (req.file) {
      // 🔥 Step 1: Compress new image first (SAFE)
      const newImagePath = await compressProductImage(
        req.file.path,
        "admin/products"
      ); 
      console.log("newImagePath:", newImagePath);
      // returns: uploads/admin/products/xxx.jpg

      // 🔥 Step 2: Delete old image AFTER success
      if (imagePath) {
        // convert DB path → actual file path
        //const actualPath = imagePath.replace("img/", "uploads/");
        // const actualPath=imagePath.split("/")
        // const fullPath = path.join(process.cwd(), actualPath);
         const filename = imagePath.split("/").pop();
                console.log("Filename:", filename);
        
                // const oldFilePath = path.join(
                //   __dirname,
                //   "../uploads/admin/products",    
                //   filename
                // );
                const oldFilePath = path.join(
          process.cwd(),
          "uploads/admin/products",
          filename
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // 🔥 Step 3: Convert new path to DB format
      imagePath = newImagePath.replace("uploads/", "img/");
    }

    // ✅ Update product
    await connection.query(
      `UPDATE product 
       SET name = ?, price = ?, image = ?, un = ?
       WHERE id = ?`,
      [
        name || rows[0].name,
        price || rows[0].price,
        imagePath,
        rows[0].un,
        id,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback(); // 🔥 IMPORTANT
    console.error("editProduct error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};


const deleteProduct = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔍 get product
    const [rows] = await connection.query(
      "SELECT * FROM product WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const imagePath = rows[0].image;

    // 🗑 delete image if exists
    if (imagePath) {
      const filename = imagePath.split("/").pop();

      const fullPath = path.join(
        process.cwd(),
        "uploads/admin/products",
        filename
      );

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // 🗑 delete DB record
    await connection.query(
      "DELETE FROM product WHERE id = ?",
      [id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback(); // 🔥 important
    console.error("deleteProduct error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
const addDiscount = async (req, res) => {
  let connection;
  try {
    const { code, discount } = req.body;

    if (!code || !discount) {
      return res.status(400).json({ success: false, message: "code and discount are required" });
    }
    if (discount <= 0 || discount > 100) {
  return res.status(400).json({
    success: false,
    message: "Discount must be between 1 and 100",
  });
}

    connection = await db.getConnection();
    await connection.beginTransaction();

    // check duplicate code
    const [existing] = await connection.query(
      "SELECT id FROM discount WHERE code = ?", [code]
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Discount code already exists" });
    }

    const [result] = await connection.query(
      "INSERT INTO discount (code, discount) VALUES (?, ?)",
      [code.toUpperCase(), discount]
    );
    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Discount added",
      data: { id: result.insertId, code: code.toUpperCase(), discount },
    });
  } catch (err) {
    console.error("addDiscount error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET ALL DISCOUNTS — GET /api/discount/all ─────────────────────────────────
const getAllDiscounts = async (req, res) => {
  let connection;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    // 🔍 search by code or discount
    if (search) {
      searchQuery = `
        AND (
          code LIKE ?
          OR discount LIKE ?
        )
      `;
      values = [`%${search}%`, `%${search}%`];
    }

    connection = await db.getConnection();

    // 📦 main query
    const [rows] = await connection.query(
      `
      SELECT id, code, discount
      FROM discount
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
      FROM discount
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
    console.error("getAllDiscounts error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const deleteDiscount = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    await connection.query("DELETE FROM discount WHERE id = ?", [id]);
    await connection.commit();
    return res.status(200).json({ success: true, message: "Discount deleted" });
  } catch (err) {
    console.error("deleteDiscount error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
}
const saveShippingPrice = async (req, res) => {
  let connection;
  try {
    const { name, price } = req.body;

    if (!price) {
      return res.status(400).json({ success: false, message: "price is required" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // check if a row exists already
    //const [existing] = await connection.query("SELECT id FROM shipping_price LIMIT 1");

    // if (existing.length) {
    //   // update existing
    //   await connection.query(
    //     "UPDATE shipping_price SET name = ?, price = ? WHERE id = ?",
    //     [name || "Shipping Amount", price, existing[0].id]
    //   );
    //   return res.status(200).json({
    //     success: true,
    //     message: "Shipping price updated",
    //     data: { id: existing[0].id, name: name || "Shipping Amount", price },
    //   });
    // } 
    
      // insert new
      const [result] = await connection.query(
        "INSERT INTO shipping_price (name, price) VALUES (?, ?)",
        [name || "Shipping Amount", price]
      );
      await connection.commit();
      return res.status(201).json({
        success: true,
        message: "Shipping price added",
        data: { id: result.insertId, name: name || "Shipping Amount", price },
      });
   
  } catch (err) {
    console.error("saveShippingPrice error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ── GET SHIPPING PRICE — GET /api/shipping/get ───────────────────────────────
const getAllShippingPrices = async (req, res) => {
  let connection;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    // 🔍 search (adjust fields based on your table)
    if (search) {
      searchQuery = `
        AND (
          price LIKE ?
        )
      `;
      values = [`%${search}%`];
    }

    connection = await db.getConnection();

    // 📦 main query
    const [rows] = await connection.query(
      `
      SELECT *
      FROM shipping_price
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
      FROM shipping_price
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
    console.error("getShippingPrice error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};



export { addProduct, getAllProducts,editProduct,
     deleteProduct,
     addDiscount, deleteDiscount, getAllDiscounts, saveShippingPrice, getAllShippingPrices };