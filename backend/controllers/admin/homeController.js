
import db from "../../config/db.js";
import compressImage from "../../utils/imageCompressor.js";
import path from "path";
import fs from "fs";
import compressSliderImage from "../../utils/sliderImageCompressor.js";

const getAllTagText = async (req, res, next) => {
  let connection;
  try {
    const isAdmin = req.query.admin === "true"; // 🔥 control switch

    connection = await db.getConnection();

    // =========================
    // ✅ WEBSITE (NO PAGINATION, NO SEARCH)
    // =========================
    if (!isAdmin) {
      const [rows] = await connection.query(`
        SELECT id, title, text
        FROM tag_text
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    }

    // =========================
    // ✅ ADMIN (PAGINATION + SEARCH)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `
        WHERE (
          title LIKE ?
          OR text LIKE ?
        )
      `;
      values = [`%${search}%`, `%${search}%`];
    }

    const [rows] = await connection.query(
      `
      SELECT id, title, text
      FROM tag_text
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM tag_text
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
    console.error("getAllTagText error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};
const getSingleTagText = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `SELECT id, title, text FROM tag_text WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    console.error("getSingleTagText error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const updateTagText = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, text } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is mandatory",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      UPDATE tag_text 
      SET title = ?, text = ?
      WHERE id = ?
      `,
      [title, text, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
    await connection.commit();
    return res.json({
      success: true,
      message: "Updated successfully ✅",
    });

  } catch (err) {
    console.error("updateTagText error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

const getAllWorks = async (req, res) => {
  let connection;
  try {
    const isAdmin = req.query.admin === "true";

    connection = await db.getConnection();

    // =========================
    // ✅ WEBSITE (NO PAGINATION)
    // =========================
    if (!isAdmin) {
      const [rows] = await connection.query(`
        SELECT id,  text
        FROM works
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    }

    // =========================
    // ✅ ADMIN (PAGINATION + SEARCH)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `
        WHERE (
          text LIKE ?
           
        )
      `;
      values = [`%${search}%`, `%${search}%`];
    }

    const [rows] = await connection.query(
      `
      SELECT id,  text
      FROM works
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM works
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
    console.error("getAllWorks error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    })
  } finally {
    if (connection) connection.release();
  }
};
const getSingleWork = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is mandatory",
      });
    }

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `SELECT id,  text FROM works WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    console.error("getSingleWork error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    })

  } finally {
    if (connection) connection.release();
  }
};
const updateWork = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is mandatory",
      });
    }


    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      UPDATE works
      SET  text = ?
      WHERE id = ?
      `,
      [text, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }
    await connection.commit();
    return res.json({
      success: true,
      message: "Work updated successfully ✅",
    });

  } catch (err) {
    console.error("updateWork error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    })
  } finally {
    if (connection) connection.release();
  }
};


const getAllWorks2 = async (req, res) => {
  let connection;
  try {
    const isAdmin = req.query.admin === "true";

    connection = await db.getConnection();

    // =========================
    // ✅ WEBSITE (NO PAGINATION)
    // =========================
    if (!isAdmin) {
      const [rows] = await connection.query(`
        SELECT id,  text
        FROM works2
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    }

    // =========================
    // ✅ ADMIN (PAGINATION + SEARCH)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `
        WHERE (
          text LIKE ?
           
        )
      `;
      values = [`%${search}%`, `%${search}%`];
    }

    const [rows] = await connection.query(
      `
      SELECT id,  text
      FROM works2
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM works2
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
    console.error("getAllWorks error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    })
  } finally {
    if (connection) connection.release();
  }
};
const getSingleWork2 = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is mandatory",
      });
    }

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `SELECT id,  text FROM works2 WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    console.error("getSingleWork error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    })

  } finally {
    if (connection) connection.release();
  }
};
const updateWork2 = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Id is mandatory",
      });
    }


    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      UPDATE works2
      SET  text = ?
      WHERE id = ?
      `,
      [text, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work not found",
      });
    }
    await connection.commit();
    return res.json({
      success: true,
      message: "Work updated successfully ✅",
    });

  } catch (err) {
    console.error("updateWork error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    })
  } finally {
    if (connection) connection.release();
  }
}

//CUSTOMER SAY
const addCustomerSay = async (req, res) => {
  let connection;
  try {
    const { title, post, text } = req.body;

    if (!title || !post || !text) {
      return res.status(400).json({
        success: false,
        message: "Title, post and text are required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(
      `
      INSERT INTO coustomer_say (title, post, text, status)
      VALUES (?, ?, ?, ?)
      `,
      [title, post, text, 0]
    );

    return res.json({
      success: true,
      message: "Added successfully ✅",
      id: result.insertId,
    });

  } catch (err) {
    console.error("addCustomerSay error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Add failed"
    })
  } finally {
    if (connection) connection.release();
  }
};
const getAllCustomerSay = async (req, res) => {
  let connection;
  try {
    const isAdmin = req.query.admin === "true";

    connection = await db.getConnection();

    // =========================
    // ✅ WEBSITE (ALL DATA, NO PAGINATION)
    // =========================
    if (!isAdmin) {
      const [websiteRows] = await connection.query(`
        SELECT id, title, post, text, status
        FROM coustomer_say
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: websiteRows,
      });
    }

    // =========================
    // ✅ ADMIN (PAGINATION + SEARCH)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `
        WHERE (
          title LIKE ?
          OR post LIKE ?
          OR text LIKE ?
        )
      `;
      values = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ];
    }

    const [rows] = await connection.query(
      `
      SELECT id, title, post, text, status
      FROM coustomer_say
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM coustomer_say
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
    console.error("getAllCustomerSay error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Get failed"
    })
  } finally {
    if (connection) connection.release();
  }
};
const getSingleCustomerSay = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `
      SELECT id, title, post, text, status
      FROM coustomer_say
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    console.error("getSingleCustomerSay error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Get failed"
    })
  } finally {
    if (connection) connection.release();
  }
};
const updateCustomerSay = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, post, text, status } = req.body;

    connection = await db.getConnection();

    const [result] = await connection.query(
      `
      UPDATE coustomer_say
      SET title = ?, post = ?, text = ?
      WHERE id = ?
      `,
      [title, post, text, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.json({
      success: true,
      message: "Updated successfully ✅",
    });

  } catch (err) {
    console.error("updateCustomerSay error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Update failed"
    })
  } finally {
    if (connection) connection.release();
  }
};
const deleteCustomerSay = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();

    const [result] = await connection.query(
      `DELETE FROM coustomer_say WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.json({
      success: true,
      message: "Deleted successfully 🗑️",
    });

  } catch (err) {
    console.error("deleteCustomerSay error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Delete failed"
    })
  } finally {
    if (connection) connection.release();
  }
};

const addSliderImage = async (req, res) => {
  let connection;
  try {
    const { text1, text2 } = req.body
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // 🔥 compress + move to slider folder
    const imagePath = await compressImage(
      req.file.path,
      "admin/slider_image"
    );

    connection = await db.getConnection();

    const [result] = await connection.query(
      `INSERT INTO slider_img (image,text1,text2)  VALUES (?,?,?)`,
      [imagePath, text1, text2]
    );

    return res.json({
      success: true,
      message: "Slider image and text added successfully ✅",
      id: result.insertId,
      image: imagePath,
    });

  } catch (err) {
    console.error("addSliderImage error:", err);
    return res.status(500).json({
      success: false,
      message: "Add failed",
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const getAllSliderImages = async (req, res) => {
  let connection;
  try {
    const isAdmin = req.query.admin === "true";

    connection = await db.getConnection();

    // =========================
    // ✅ WEBSITE (NO PAGINATION)
    // =========================
    if (!isAdmin) {
      const [rows] = await connection.query(`
        SELECT id, image,text1,text2
        FROM slider_img
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    }

    // =========================
    // ✅ ADMIN (PAGINATION + SEARCH)
    // =========================
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    // 🔥 Important: Sl No is virtual → we map it using id DESC order
    let searchQuery = "";
    let values = [];

    if (search) {
      // search by id (approx for Sl No)
      searchQuery = `WHERE id LIKE ?`;
      values = [`%${search}%`];
    }

    const [rows] = await connection.query(
      `
       SELECT id, image, text1, text2
      FROM slider_img
      ${searchQuery}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) as total
      FROM slider_img
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
    console.error("getAllSliderImages error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Get failed"
    })
  } finally {
    if (connection) connection.release();
  }
};

// const deleteSliderImage = async (req, res) => {
//   let connection;
//   try {
//     const { id } = req.params;

//     connection = await db.getConnection();

//     const [result] = await connection.query(
//       `DELETE FROM slider_img WHERE id = ?`,
//       [id]
//     );

//     const imagePath = result[0].image;

//         // 🗑 delete image if exists
//         if (imagePath) {
//           const filename = imagePath.split("/").pop();

//           const fullPath = path.join(
//             process.cwd(),
//             "uploads/admin/slider_image",
//             filename
//           );

//           if (fs.existsSync(fullPath)) {
//             fs.unlinkSync(fullPath);
//           }
//         }

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Image not found",
//       });
//     }

//     return res.json({
//       success: true,
//       message: "Deleted successfully 🗑️",
//     });

//   } catch (err) {
//     console.error("deleteSliderImage error:", err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//       message: "Delete failed"
//     })
//   } finally {
//     if (connection) connection.release();
//   }
// };

const deleteSliderImage = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();

    // 🔥 1. Get image path first
    const [rows] = await connection.query(
      `SELECT image FROM slider_img WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const imagePath = rows[0].image;

    // 🔥 2. Delete file FIRST
    if (imagePath) {
      const fullPath = path.join(process.cwd(), "uploads", imagePath);

      console.log("Deleting file:", fullPath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      } else {
        console.warn("File not found on disk:", fullPath);
      }
    }

    // 🔥 3. Delete from DB AFTER file delete
    await connection.query(
      `DELETE FROM slider_img WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Deleted successfully 🗑️",
    });

  } catch (err) {
    console.error("deleteSliderImage error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Delete failed",
    });

  } finally {
    if (connection) connection.release();
  }
};
const editSliderImage = async (req, res) => {
  let connection;
  let newImagePath = null;

  try {
    const { id } = req.params;
    const { text1, text2 } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔥 1. Get old image
    const [rows] = await connection.query(
      `SELECT image FROM slider_img WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    const oldImage = rows[0].image;

    // 🔥 2. Compress new image (always stored inside uploads)
    if (req.file) {
      newImagePath = await compressSliderImage(
        req.file.path,
        "admin/slider_image"
      );
      // newImagePath = await compressImage(
      //   req.file.path,
      //   "admin/slider_image"
      // ); // returns: admin/slider_image/xyz.jpg
    }

    // 🔥 3. Update DB
    let updateQuery = `
      UPDATE slider_img 
      SET text1 = ?, text2 = ?
    `;
    let values = [text1?.trim() || "", text2?.trim() || ""];

    if (newImagePath) {
      updateQuery += `, image = ?`;
      values.push(newImagePath);
    }

    updateQuery += ` WHERE id = ?`;
    values.push(id);

    const [result] = await connection.query(updateQuery, values);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Update failed",
      });
    }

    await connection.commit(); // ✅ commit first

    // 🔥 4. Delete old image
    // if (newImagePath && oldImage && newImagePath !== oldImage) {
    //   const oldPath = path.join(process.cwd(), "uploads", oldImage);

    //   console.log("Deleting old:", oldPath);

    //   try {
    //     if (fs.existsSync(oldPath)) {
    //       await fs.promises.unlink(oldPath);
    //       console.log("Old image deleted ✅");
    //     } else {
    //       console.warn("Old image not found ❌:", oldPath);
    //     }
    //   } catch (err) {
    //     console.error("Delete error:", err);
    //   }
    // }
    // 🔥 4. Delete old image safely
    if (newImagePath && oldImage && newImagePath !== oldImage) {
      const oldPath = path.join(process.cwd(), "uploads", oldImage);

      console.log("Deleting:", oldPath);

      try {
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
          console.log("Old image deleted ✅");
        } else {
          console.warn("File not found ❌:", oldPath);
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully ✏️",
      image: newImagePath || oldImage,
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("editSliderImage error:", err);

    // 🔥 cleanup new image if error
    if (newImagePath) {
      const newPath = path.join(process.cwd(), "uploads", newImagePath);

      try {
        if (fs.existsSync(newPath)) {
          await fs.promises.unlink(newPath);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Update failed",
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
// const deleteSliderImage = async (req, res) => {
//   let connection;
//   try {
//     const { id } = req.params;

//     connection = await db.getConnection();

//     // 🔥 1. Get image path first
//     const [rows] = await connection.query(
//       `SELECT image FROM slider_img WHERE id = ?`,
//       [id]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Image not found",
//       });
//     }

//     const imagePath = rows[0].image;

//     // 🔥 2. Delete file FIRST
//     if (imagePath) {
//       const fullPath = path.join(process.cwd(), "uploads", imagePath);

//       console.log("Deleting file:", fullPath);

//       if (fs.existsSync(fullPath)) {
//         fs.unlinkSync(fullPath);
//       } else {
//         console.warn("File not found on disk:", fullPath);
//       }
//     }

//     // 🔥 3. Delete from DB AFTER file delete
//     await connection.query(
//       `DELETE FROM slider_img WHERE id = ?`,
//       [id]
//     );

//     return res.json({
//       success: true,
//       message: "Deleted successfully 🗑️",
//     });

//   } catch (err) {
//     console.error("deleteSliderImage error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//       message: "Delete failed",
//     });

//   } finally {
//     if (connection) connection.release();
//   }
// };


const getAllRegisterImage=async(req,res)=>{
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(`SELECT * FROM register_image`);
    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getAllSliderImage error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Get failed",
    });
  } finally {
    if (connection) connection.release();
  }
}
const editRegisterImage = async (req, res) => {
  let connection;
  let newImagePath = null;

  try {
    const { id } = req.params;

    // ✅ validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
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

    // 🔥 1. Get old image
    const [rows] = await connection.query(
      `SELECT image FROM register_image WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const oldImage = rows[0].image;

    // 🔥 2. Upload & compress new image
    newImagePath = await compressImage(
      req.file.path,
      "admin/register_image"
    );

    // 🔥 3. Update DB
    const [result] = await connection.query(
      `UPDATE register_image SET image = ? WHERE id = ?`,
      [newImagePath, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Update failed",
      });
    }

    // ✅ commit first
    await connection.commit();

    // 🔥 4. Delete old image safely (AFTER commit)
    if (oldImage && newImagePath !== oldImage) {
      const oldPath = path.join(process.cwd(), "uploads", oldImage);

      console.log("Deleting old:", oldPath);

      try {
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
          console.log("Old image deleted ✅");
        } else {
          console.warn("File not found ❌:", oldPath);
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Image updated successfully ✅",
      image: newImagePath,
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("editRegisterPageImage error:", err);

    // 🔥 cleanup new uploaded image if error
    if (newImagePath) {
      const newPath = path.join(process.cwd(), "uploads", newImagePath);

      try {
        if (fs.existsSync(newPath)) {
          await fs.promises.unlink(newPath);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Update failed",
      error: err.message,
    });

  } finally {
    if (connection) connection.release();
  }
};
  export {
    addSliderImage, getAllSliderImages, deleteSliderImage,
    getAllTagText, getSingleTagText, updateTagText, getAllWorks, getSingleWork, updateWork,
    getAllWorks2, getSingleWork2, updateWork2, addCustomerSay, getAllCustomerSay, getSingleCustomerSay,
    deleteCustomerSay, updateCustomerSay, editSliderImage, getAllRegisterImage,editRegisterImage
  };