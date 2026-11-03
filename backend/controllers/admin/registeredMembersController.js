import db from "../../config/db.js";






// const getAllRegisteredMembers = async (req, res) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const limit = Math.min(
//       100,
//       Math.max(1, parseInt(req.query.limit, 10) || 30)
//     );

//     const search = (req.query.search || "").trim();
//     const groupId = req.query.groupId;
//     const cursor = req.query.cursor;

//     // Validate cursor: it must be a positive integer ID.
//     let cursorId = null;

//     if (cursor !== undefined && cursor !== "") {
//       cursorId = Number(cursor);

//       if (!Number.isSafeInteger(cursorId) || cursorId <= 0) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid cursor",
//         });
//       }
//     }

//     let searchCondition = "";
//     let groupCondition = "";
//     let cursorCondition = "";

//     const values = [];

//     // Search by registered member or their profiles.
//     if (search) {
//       const like = `%${search}%`;

//       searchCondition = `
//         AND (
//           r.mobile LIKE ? OR
//           r.name LIKE ? OR
//           DATE_FORMAT(r.date, '%Y-%m-%d') LIKE ? OR
//           EXISTS (
//             SELECT 1
//             FROM information i
//             WHERE i.register_id = r.id
//               AND (
//                 i.name LIKE ? OR
//                 i.phone LIKE ? OR
//                 i.email LIKE ? OR
//                 i.card_id LIKE ?
//               )
//           )
//         )
//       `;

//       values.push(
//         like,
//         like,
//         like,
//         like,
//         like,
//         like,
//         like
//       );
//     }

//     // Filter registered members by group.
//     if (groupId !== undefined && groupId !== "") {
//       const parsedGroupId = Number(groupId);

//       if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid groupId",
//         });
//       }

//       groupCondition = `
//         AND EXISTS (
//           SELECT 1
//           FROM member_group_members gm
//           WHERE gm.register_id = r.id
//             AND gm.group_id = ?
//         )
//       `;

//       values.push(parsedGroupId);
//     }

//     // Fetch records older than the last returned member ID.
//     if (cursorId !== null) {
//       cursorCondition = `AND r.id < ?`;
//       values.push(cursorId);
//     }

//     // Fetch one extra record to determine whether another batch exists.
//     const [users] = await connection.query(
//       `
//       SELECT
//         r.id,
//         r.mobile,
//         r.name,
//         DATE_FORMAT(r.date, '%Y-%m-%d') AS date
//       FROM register r
//       WHERE 1 = 1
//         ${searchCondition}
//         ${groupCondition}
//         ${cursorCondition}
//       ORDER BY r.id DESC
//       LIMIT ?
//       `,
//       [...values, limit + 1]
//     );

//     const hasMore = users.length > limit;

//     // Remove the extra record used to determine hasMore.
//     const data = hasMore ? users.slice(0, limit) : users;

//     // The next request starts after the last record in this batch.
//     const nextCursor =
//       hasMore && data.length > 0
//         ? String(data[data.length - 1].id)
//         : null;

//     return res.json({
//       success: true,
//       data,
//       pagination: {
//         limit,
//         nextCursor,
//         hasMore,
//       },
//     });
//   } catch (err) {
//     console.error("getAllRegisteredMembers error:", err);

//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch registered members",
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getAllRegisteredMembers = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
    );

    const search = String(req.query.search || "").trim();
    const groupId = req.query.groupId;
    const ungrouped =
      String(req.query.ungrouped || "").toLowerCase() === "true";
    const cursor = req.query.cursor;

    const conditions = [];
    const values = [];

    // Search registered members and their profiles.
    if (search) {
      const like = `%${search}%`;

      conditions.push(`(
        r.mobile LIKE ? OR
        r.name LIKE ? OR
        DATE_FORMAT(r.date, '%Y-%m-%d') LIKE ? OR
        EXISTS (
          SELECT 1
          FROM information i
          WHERE i.register_id = r.id
            AND (
              i.name LIKE ? OR
              i.phone LIKE ? OR
              i.email LIKE ? OR
              i.card_id LIKE ?
            )
        )
      )`);

      values.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    // Do not allow groupId and ungrouped simultaneously.
    if (ungrouped && groupId !== undefined && groupId !== "") {
      return res.status(400).json({
        success: false,
        error: "Use either ungrouped=true or groupId, not both.",
      });
    }

    // Ungrouped: members who do not belong to ANY group.
    if (ungrouped) {
      conditions.push(`
        NOT EXISTS (
          SELECT 1
          FROM member_group_members gm
          WHERE gm.register_id = r.id
        )
      `);
    }

    // Specific group: members belonging to that group.
    else if (groupId !== undefined && groupId !== "") {
      const parsedGroupId = Number(groupId);

      if (
        !Number.isSafeInteger(parsedGroupId) ||
        parsedGroupId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid groupId",
        });
      }

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM member_group_members gm
          WHERE gm.register_id = r.id
            AND gm.group_id = ?
        )
      `);

      values.push(parsedGroupId);
    }

    // Cursor-based pagination.
    if (cursor !== undefined && cursor !== "") {
      const parsedCursor = Number(cursor);

      if (
        !Number.isSafeInteger(parsedCursor) ||
        parsedCursor <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid cursor",
        });
      }

      conditions.push("r.id < ?");
      values.push(parsedCursor);
    }

    const whereSql = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [fetchedRows] = await connection.query(
      `SELECT
         r.id,
         r.mobile,
         r.name,
         DATE_FORMAT(r.date, '%d-%m-%Y') AS date
       FROM register r
       ${whereSql}
       ORDER BY r.id DESC
       LIMIT ?`,
      [...values, limit + 1]
    );

    // Fetch one extra row to determine whether more results exist.
    const hasMore = fetchedRows.length > limit;

    const users = hasMore
      ? fetchedRows.slice(0, limit)
      : fetchedRows;

    const nextCursor =
      hasMore && users.length
        ? String(users[users.length - 1].id)
        : null;

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
    });
  } catch (err) {
    console.error("getAllRegisteredMembers error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const getProfilesByUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();

    const [profiles] = await connection.query(
      `
      SELECT 
        id,
        name,
        phone,
        email,
        profile AS type,
        card_id
      FROM information
      WHERE register_id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      data: profiles,
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

const assignTagToUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;     // profile id
    const { code } = req.body;     // QR / tag code

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔥 1. CHECK: QR already linked to another profile
    const [existing] = await connection.query(
      `SELECT id FROM information WHERE card_id = ? AND status = 1`,
      [code]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This tag is already assigned to another user",
      });
    }

    // 🔥 2. CHECK: QR exists + get date
    const [qrData] = await connection.query(
      `SELECT date1, status FROM new_qr WHERE code = ?`,
      [code]
    );

    if (qrData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

   

    const qrDate = qrData[0].date1;

    // 🔥 3. UPDATE QR status
    await connection.query(
      `UPDATE new_qr SET status = 1 WHERE code = ?`,
      [code]
    );

    // 🔥 4. UPDATE information (assign tag)
    const [updateInfo] = await connection.query(
      `UPDATE information 
       SET card_id = ?, date = ? 
       WHERE id = ?`,
      [code, qrDate, id]
    );

    if (updateInfo.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Tag assigned successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "This tag is already assigned",
      });
    }

    console.error("assignTagToUser error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

const disableAssignedTagToUser = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { card_id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    if (!card_id) {
      return res.status(400).json({
        success: false,
        message: "Tag Id is required",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 🔥 run both queries
    const [infoResult, qrResult] = await Promise.all([
      connection.query(
        "UPDATE information SET card_id = NULL WHERE id = ? AND card_id = ?",
        [id, card_id]
      ),
      connection.query(
        "UPDATE new_qr SET status = 0 WHERE code = ?",
        [card_id]
      ),
    ]);

    // ✅ check if update actually happened
    if (infoResult[0].affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Tag not found or already removed",
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Tag disabled successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("deleteAssignedTag error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};


const deleteRegisteredMember = async (req, res) => {
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

    // 🔥 1. Get profile + card_id in one query
    const [profile] = await connection.query(
      `SELECT id, card_id FROM information WHERE id = ?`,
      [id]
    );

    if (profile.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const cardId = profile[0].card_id;

    // 🔥 2. Delete child records (parallel safe inside transaction)
    await Promise.all([
      connection.query(`DELETE FROM allergies WHERE information_id = ?`, [id]),
      connection.query(`DELETE FROM medicine WHERE information_id = ?`, [id]),
      connection.query(`DELETE FROM health_insurance WHERE information_id = ?`, [id]),
      connection.query(`DELETE FROM vital_medical WHERE information_id = ?`, [id]),
      connection.query(`DELETE FROM emergency_contact WHERE information_id = ?`, [id]),
    ]);

    // 🔥 3. Reset QR if exists
    if (cardId) {
      await connection.query(
        `UPDATE new_qr SET status = 0 WHERE code = ?`,
        [cardId]
      );
    }

    // 🔥 4. Delete main profile
    await connection.query(`DELETE FROM information WHERE id = ?`, [id]);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("deleteRegisteredMember error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const createGroup = async (req, res) => {
  let connection;

  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    connection = await db.getConnection();

    const [result] = await connection.query(
      `INSERT INTO member_groups (name, description)
       VALUES (?, ?)`,
      [name.trim(), description?.trim() || null]
    );

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: {
        id: result.insertId,
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A group with this name already exists",
      });
    }

    console.error("createGroup error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
const deleteGroup = async (req, res) => {
  let connection;

  try {
    const groupId = Number(req.params.groupId);

    if (!Number.isSafeInteger(groupId) || groupId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    connection = await db.getConnection();

    // Check whether the group exists.
    const [groups] = await connection.query(
      `SELECT id FROM member_groups WHERE id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // A group can only be deleted if it has no members.
    const [members] = await connection.query(
      `SELECT register_id
       FROM member_group_members
       WHERE group_id = ?
       LIMIT 1`,
      [groupId]
    );

    if (members.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This group has members. Remove all members before deleting it.",
      });
    }

    // Repeat the empty-group condition in the DELETE itself
    // to avoid deleting a group that has acquired a member.
    const [result] = await connection.query(
      `DELETE FROM member_groups
       WHERE id = ?
         AND NOT EXISTS (
           SELECT 1
           FROM member_group_members gm
           WHERE gm.group_id = member_groups.id
         )`,
      [groupId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message: "The group could not be deleted. It may now contain members.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (err) {
    console.error("deleteGroup error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete group",
    });
  } finally {
    if (connection) connection.release();
  }
};


// const getAllGroups = async (req, res) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const [groups] = await connection.query(`
//       SELECT
//         g.id,
//         g.name,
//         g.description,
//         g.created_at,
//         COUNT(gm.register_id) AS member_count
//       FROM member_groups g
//       LEFT JOIN member_group_members gm
//         ON gm.group_id = g.id
//       GROUP BY
//         g.id,
//         g.name,
//         g.description,
//         g.created_at
//       ORDER BY g.id DESC
//     `);

//     return res.json({
//       success: true,
//       data: groups,
//     });
//   } catch (err) {
//     console.error("getAllGroups error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getAllGroups = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();

    const [groups] = await connection.query(`
      SELECT
        g.id,
        g.name,
        g.description,
        g.created_at,
        COUNT(DISTINCT gm.register_id) AS member_count
      FROM member_groups g
      LEFT JOIN member_group_members gm
        ON gm.group_id = g.id
      GROUP BY
        g.id,
        g.name,
        g.description,
        g.created_at
      ORDER BY g.id DESC
    `);

    const [[counts]] = await connection.query(`
      SELECT
        COUNT(*) AS total_members,
        COALESCE(
          SUM(
            CASE
              WHEN NOT EXISTS (
                SELECT 1
                FROM member_group_members gm
                WHERE gm.register_id = r.id
              )
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS ungrouped_count
      FROM register r
    `);

    return res.status(200).json({
      success: true,
      total_members: Number(counts.total_members),
      ungrouped_count: Number(counts.ungrouped_count),
      data: groups,
    });
  } catch (err) {
    console.error("getAllGroups error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const assignUserToGroup = async (req, res) => {
  let connection;

  try {
    const groupId = Number(req.params.groupId);
    const registerId = Number(req.params.registerId);

    if (
      !Number.isSafeInteger(groupId) ||
      groupId <= 0 ||
      !Number.isSafeInteger(registerId) ||
      registerId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid group ID and registered member ID are required",
      });
    }

    connection = await db.getConnection();

    // Check whether the group exists.
    const [groups] = await connection.query(
      `SELECT id FROM member_groups WHERE id = ?`,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check whether the registered member exists.
    const [users] = await connection.query(
      `SELECT id FROM register WHERE id = ?`,
      [registerId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registered member not found",
      });
    }

    // Assign member to group.
    const [result] = await connection.query(
      `INSERT IGNORE INTO member_group_members
        (group_id, register_id)
       VALUES (?, ?)`,
      [groupId, registerId]
    );

    if (result.affectedRows === 0) {
      return res.status(200).json({
        success: true,
        message: "Member is already assigned to this group",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member assigned to group successfully",
    });
  } catch (err) {
    console.error("assignUserToGroup error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    if (connection) connection.release();
  }
};
// const removeUserFromGroup = async (req, res) => {
//   let connection;

//   try {
//     const groupId = Number(req.params.groupId);
//     const registerId = Number(req.params.registerId);

//     if (
//       !Number.isSafeInteger(groupId) ||
//       groupId <= 0 ||
//       !Number.isSafeInteger(registerId) ||
//       registerId <= 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid group ID and registered member ID are required",
//       });
//     }

//     connection = await db.getConnection();

//     const [result] = await connection.query(
//       `DELETE FROM member_group_members
//        WHERE group_id = ? AND register_id = ?`,
//       [groupId, registerId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Member is not assigned to this group",
//       });
//     }

//     return res.json({
//       success: true,
//       message: "Member removed from group successfully",
//     });
//   } catch (err) {
//     console.error("removeUserFromGroup error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getMemberGroups = async (req, res, next) => {
  try {
    const registerId = Number(req.params.registerId);

    if (!Number.isInteger(registerId) || registerId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid member id." });
    }

    const [[member]] = await db.query(`SELECT id FROM register WHERE id = ? LIMIT 1`, [registerId]);

    if (!member) {
      return res.status(404).json({ success: false, message: "Registered member not found." });
    }

    const [rows] = await db.query(
      `SELECT group_id FROM member_group_members WHERE register_id = ?`,
      [registerId]
    );

    // array of group ids the member currently belongs to
    return res.status(200).json({ success: true, data: rows.map((r) => r.group_id) });
  } catch (err) {
    console.error("❌ getMemberGroups:", err);
    next(err);
  }
};

const syncMemberGroups = async (req, res, next) => {
  let connection;
  let inTransaction = false;

  try {
    const registerId = Number(req.params.registerId);

    if (!Number.isInteger(registerId) || registerId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid member id." });
    }

    const raw = req.body?.groupIds;

    if (!Array.isArray(raw)) {
      return res.status(400).json({ success: false, message: "groupIds must be an array." });
    }

    const groupIds = [...new Set(raw.map(Number))];

    if (groupIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ success: false, message: "Invalid group id." });
    }

    connection = await db.getConnection();

    const [[member]] = await connection.query(
      `SELECT id FROM register WHERE id = ? LIMIT 1`,
      [registerId]
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "Registered member not found." });
    }

    if (groupIds.length > 0) {
      const [found] = await connection.query(
        `SELECT id FROM member_groups WHERE id IN (?)`,
        [groupIds]
      );

      if (found.length !== groupIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected groups do not exist.",
        });
      }
    }

    await connection.beginTransaction();
    inTransaction = true;

    const [current] = await connection.query(
      `SELECT group_id FROM member_group_members WHERE register_id = ? FOR UPDATE`,
      [registerId]
    );

    const currentIds = new Set(current.map((r) => Number(r.group_id)));
    const wanted = new Set(groupIds);

    const toAdd = groupIds.filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !wanted.has(id));

    if (toAdd.length > 0) {
      // INSERT IGNORE + the unique index below = no duplicate memberships, even on a double click
      await connection.query(
        `INSERT IGNORE INTO member_group_members (group_id, register_id) VALUES ?`,
        [toAdd.map((groupId) => [groupId, registerId])]
      );
    }

    if (toRemove.length > 0) {
      // only the membership rows are deleted, never the member or their profiles
      await connection.query(
        `DELETE FROM member_group_members WHERE register_id = ? AND group_id IN (?)`,
        [registerId, toRemove]
      );
    }

    await connection.commit();
    inTransaction = false;

    return res.status(200).json({
      success: true,
      message: "Group membership updated successfully.",
      data: groupIds,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (err) {
    if (connection && inTransaction) await connection.rollback();
    console.error("❌ syncMemberGroups:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
export { getAllRegisteredMembers, getProfilesByUser, assignTagToUser, disableAssignedTagToUser,
   deleteRegisteredMember, createGroup,deleteGroup, getAllGroups, assignUserToGroup,
   getMemberGroups, syncMemberGroups };





   // const customersRegisterdButTagNotPurchased=async(req,res)=>{
//     try {
//     connection = await db.getConnection();

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const search = req.query.search || "";
//     const offset = (page - 1) * limit;

//     let searchCondition = "";
//     let values = [];

//     if (search) {
//       const like = `%${search}%`;

//       searchCondition = `
//         AND (
//           r.mobile LIKE ? OR
//           r.name LIKE ? OR
//           DATE_FORMAT(r.date, '%Y-%m-%d') LIKE ? OR
//           EXISTS (
//             SELECT 1
//             FROM information i
//             WHERE i.register_id = r.id
//             AND (
//               i.name LIKE ? OR
//               i.phone LIKE ? OR
//               i.email LIKE ? OR
//               i.card_id LIKE ?
//             )
//           )
//         )
//       `;

//       values = [like, like, like, like, like, like, like];
//     }

//     // ✅ CTE Query
//     const [users] = await connection.query(
//       `
//    WITH filtered_users AS (
//   SELECT r.id
//   FROM register r
//   INNER JOIN information i ON r.id = i.register_id
//   WHERE 1=1
//   ${searchCondition}
//   AND i.card_id IS NOT NULL
// )

//       SELECT *
//       FROM filtered_users
//       ORDER BY id DESC
//       LIMIT ? OFFSET ?
//       `,
//       [...values, limit, offset]
//     );

//     // ✅ Count using same CTE logic
//     const [countResult] = await connection.query(
//       `
//       WITH filtered_users AS (
//         SELECT r.id
//         FROM register r
//         WHERE 1=1
//         ${searchCondition}
//       )

//       SELECT COUNT(*) AS total FROM filtered_users
//       `,
//       values
//     );

//     const total = countResult[0].total;

//     return res.json({
//       success: true,
//       data: users,
//       pagination: {
//         total,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//       },
//     });

//   } catch (err) {
//     console.error("getAllRegisteredMembers error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// }
// const customersHavingProfileButNoEmergencyContact = async (req, res) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const search = req.query.search || "";
//     const offset = (page - 1) * limit;

//     let searchCondition = "";
//     let values = [];

//     // 🔍 Search logic
//     if (search) {
//       const like = `%${search}%`;

//       searchCondition = `
//         AND (
//           r.mobile LIKE ? OR
//           r.name LIKE ? OR
//           DATE_FORMAT(r.date, '%Y-%m-%d') LIKE ? OR
//           i.name LIKE ? OR
//           i.phone LIKE ? OR
//           i.email LIKE ? OR
//           i.card_id LIKE ?
//         )
//       `;

//       values = [like, like, like, like, like, like, like];
//     }

//     // ✅ MAIN QUERY (correct logic)
//     const [users] = await connection.query(
//       `
//       WITH filtered_profiles AS (
//   SELECT 
//     r.id AS register_id,
//     r.name AS register_name,
//     r.mobile,
//     i.id AS information_id,
//     i.name AS profile_name,
//     i.phone,
//     i.email,
//     DATE_FORMAT(r.date, '%Y-%m-%d') AS date
//   FROM register r
//   INNER JOIN information i 
//     ON r.id = i.register_id   

//   LEFT JOIN emergency_contact ec 
//     ON i.id = ec.information_id

//   WHERE ec.id IS NULL        
//   ${searchCondition}
// )

// SELECT *
// FROM filtered_profiles
// ORDER BY register_id DESC
// LIMIT ? OFFSET ?
//       `,
//       [...values, limit, offset]
//     );

//     // ✅ COUNT QUERY (must match EXACT logic)
//     const [countResult] = await connection.query(
//       `
//     WITH filtered_profiles AS (
//   SELECT i.id
//   FROM register r
//   INNER JOIN information i 
//     ON r.id = i.register_id

//   LEFT JOIN emergency_contact ec 
//     ON i.id = ec.information_id

//   WHERE ec.id IS NULL
//   ${searchCondition}
// )

// SELECT COUNT(*) AS total FROM filtered_profiles
//       `,
//       values
//     );

//     const total = countResult[0].total;

//     return res.json({
//       success: true,
//       data: users,
//       pagination: {
//         total,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//       },
//     });

//   } catch (err) {
//     console.error("customersHavingProfileButNoEmergencyContact error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const customersHavingProfileButNoEmergencyContact = async (req, res) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 5;
//     const search = req.query.search || "";
//     const offset = (page - 1) * limit;

//     let searchCondition = "";
//     let values = [];

//     // 🔍 Search logic
//     if (search) {
//       const like = `%${search}%`;

//       searchCondition = `
//         AND (
//           r.mobile LIKE ? OR
//           r.name LIKE ? OR
//           DATE_FORMAT(r.date, '%Y-%m-%d') LIKE ? OR
//           i.name LIKE ? OR
//           i.phone LIKE ? OR
//           i.email LIKE ? OR
//           i.card_id LIKE ?
//         )
//       `;

//       values = [like, like, like, like, like, like, like];
//     }

//     // ✅ MAIN QUERY (correct logic)
//     const [users] = await connection.query(
//       `
//       WITH filtered_profiles AS (
//   SELECT 
//     r.id AS register_id,
//     r.name AS register_name,
//     r.mobile,
//     i.id AS information_id,
//     i.name AS profile_name,
//     i.phone,
//     i.email,
//     DATE_FORMAT(r.date, '%Y-%m-%d') AS date
//   FROM register r
//   INNER JOIN information i 
//     ON r.id = i.register_id   

//   LEFT JOIN emergency_contact ec 
//     ON i.id = ec.information_id

//   WHERE ec.id IS NULL        
//   ${searchCondition}
// )

// SELECT *
// FROM filtered_profiles
// ORDER BY register_id DESC
// LIMIT ? OFFSET ?
//       `,
//       [...values, limit, offset]
//     );

//     // ✅ COUNT QUERY (must match EXACT logic)
//     const [countResult] = await connection.query(
//       `
//     WITH filtered_profiles AS (
//   SELECT i.id
//   FROM register r
//   INNER JOIN information i 
//     ON r.id = i.register_id

//   LEFT JOIN emergency_contact ec 
//     ON i.id = ec.information_id

//   WHERE ec.id IS NULL
//   ${searchCondition}
// )

// SELECT COUNT(*) AS total FROM filtered_profiles
//       `,
//       values
//     );

//     const total = countResult[0].total;

//     return res.json({
//       success: true,
//       data: users,
//       pagination: {
//         total,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//       },
//     });

//   } catch (err) {
//     console.error("customersHavingProfileButNoEmergencyContact error:", err);

//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   } finally {
//     if (connection) connection.release();
//   }
// };