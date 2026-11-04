import pool from "../../config/db.js";

// ==================================================
// COMMON HELPERS
// ==================================================

const encodeCursor = (data) => {
    return Buffer.from(JSON.stringify(data)).toString("base64");
};

const decodePersonnelCursor = (cursor) => {
    try {
        const parsed = JSON.parse(
            Buffer.from(cursor, "base64").toString("utf8")
        );

        if (
            !Number.isInteger(Number(parsed.personnel_id)) ||
            Number(parsed.personnel_id) <= 0
        ) {
            return null;
        }

        return {
            personnel_id: Number(parsed.personnel_id),
        };
    } catch {
        return null;
    }
};

const decodeLeaveCursor = (cursor) => {
    try {
        const parsed = JSON.parse(
            Buffer.from(cursor, "base64").toString("utf8")
        );

        if (
            !parsed.from_date ||
            !/^\d{4}-\d{2}-\d{2}$/.test(parsed.from_date) ||
            !Number.isInteger(Number(parsed.leave_id)) ||
            Number(parsed.leave_id) <= 0
        ) {
            return null;
        }

        return {
            from_date: parsed.from_date,
            leave_id: Number(parsed.leave_id),
        };
    } catch {
        return null;
    }
};

const isValidDate = (value) => {
    if (typeof value !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const isValidTime = (time) => {
    if (!time) return true;

    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(time));
};

const formatDate = (date) => {
    if (!date) return null;

    if (typeof date === "string") {
        return date.slice(0, 10);
    }

    // Avoid timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// const validateLeaveData = ({
//     personnel_id,
//     from_date,
//     to_date,
//     from_time,
//     to_time,
//     remarks,
// }) => {
//     if (!personnel_id || !Number.isInteger(Number(personnel_id))) {
//         return "Valid personnel ID is required.";
//     }

//     if (!isValidDate(from_date)) {
//         return "Valid from date is required in YYYY-MM-DD format.";
//     }

//     if (!isValidDate(to_date)) {
//         return "Valid to date is required in YYYY-MM-DD format.";
//     }

//     if (to_date < from_date) {
//         return "To date cannot be earlier than from date.";
//     }

//     if ((from_time && !to_time) || (!from_time && to_time)) {
//         return "Both from time and to time are required.";
//     }

//     if (from_time && to_time) {
//         if (
//             !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(from_time) ||
//             !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(to_time)
//         ) {
//             return "Invalid time format.";
//         }

//         if (from_date === to_date && to_time <= from_time) {
//             return "To time must be later than from time.";
//         }
//     }

//     if (!remarks || !remarks.trim()) {
//         return "Leave remarks are required.";
//     }

//     if (remarks.trim().length > 255) {
//         return "Remarks cannot exceed 255 characters.";
//     }

//     return null;
// };
// ==================================================
// PERSONNEL CONTROLLERS
// ==================================================

// --------------------------------------------------
// GET ALL PERSONNEL - CURSOR PAGINATION
// --------------------------------------------------
const validateLeaveData = ({
    personnel_id,
    from_date,
    to_date,
    from_time_period,
    to_time_period,
    remarks,
}) => {
    if (!personnel_id || !Number.isInteger(Number(personnel_id))) {
        return "Valid personnel ID is required.";
    }

    if (!isValidDate(from_date)) {
        return "Valid from date is required in YYYY-MM-DD format.";
    }

    if (!isValidDate(to_date)) {
        return "Valid to date is required in YYYY-MM-DD format.";
    }

    if (to_date < from_date) {
        return "To date cannot be earlier than from date.";
    }

    if (!["AM", "PM"].includes(from_time_period)) {
        return "From period must be AM or PM.";
    }

    if (!["AM", "PM"].includes(to_time_period)) {
        return "To period must be AM or PM.";
    }

    if (!remarks || !remarks.trim()) {
        return "Leave remarks are required.";
    }

    if (remarks.trim().length > 255) {
        return "Remarks cannot exceed 255 characters.";
    }

    return null;
};

const getAllPersonnel = async (req, res, next) => {
    try {
        const {
            search = "",
            district = "",
            recruited_unit = "",
            from_date,
            to_date,
            cursor,
        } = req.query;

        // Page size: default 20, maximum 100
        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 20, 1),
            100
        );

        // -----------------------------------------
        // 1. Build filters
        // -----------------------------------------

        const conditions = [];
        const values = [];

        // Search by name, WBP ID, PTS Chest No or district
       
// recruited unit, or mobile number
if (search.trim()) {
    conditions.push(`
        (
            name LIKE ?
            OR wbp_id LIKE ?
            OR pts_chest_no LIKE ?
            OR home_district LIKE ?
            OR recruited_unit LIKE ?
            OR mobile_no LIKE ?
        )
    `);

    const searchValue = `%${search.trim()}%`;

    values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
    );
}

        // District filter
        if (district.trim()) {
            conditions.push("home_district = ?");
            values.push(district.trim());
        }

        // Recruited unit filter
        if (recruited_unit.trim()) {
            conditions.push("recruited_unit = ?");
            values.push(recruited_unit.trim());
        }

        // -----------------------------------------
        // Leave date range filter
        // -----------------------------------------

        if (from_date || to_date) {
            if (!from_date || !to_date) {
                return res.status(400).json({
                    success: false,
                    message: "Both from_date and to_date are required.",
                });
            }

            if (
                !isValidDate(from_date) ||
                !isValidDate(to_date) ||
                from_date > to_date
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid leave date range.",
                });
            }

            conditions.push(`
                EXISTS (
                    SELECT 1
                    FROM personnel_leaves pl
                    WHERE pl.personnel_id = personnel.personnel_id
                      AND pl.from_date <= ?
                      AND pl.to_date >= ?
                )
            `);

            values.push(to_date, from_date);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        // -----------------------------------------
        // 2. Get total matching personnel count
        // -----------------------------------------

        const countQuery = `
            SELECT COUNT(*) AS total
            FROM personnel
            ${whereClause}
        `;

        const [countRows] = await pool.execute(
            countQuery,
            values
        );

        const total = Number(countRows[0].total);

        // -----------------------------------------
        // 3. Cursor pagination
        // -----------------------------------------

        const paginationConditions = [...conditions];
        const paginationValues = [...values];

        if (cursor) {
            const decodedCursor = decodePersonnelCursor(cursor);

            if (
                !decodedCursor ||
                !Number.isInteger(Number(decodedCursor.personnel_id)) ||
                Number(decodedCursor.personnel_id) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pagination cursor.",
                });
            }

            // ASCENDING order:
            // Fetch personnel IDs greater than the previous cursor
            paginationConditions.push("personnel_id > ?");

            paginationValues.push(
                Number(decodedCursor.personnel_id)
            );
        }

        const paginationWhereClause = paginationConditions.length
            ? `WHERE ${paginationConditions.join(" AND ")}`
            : "";

        // -----------------------------------------
        // 4. Fetch personnel
        // -----------------------------------------

        const query = `
            SELECT
                personnel_id,
                serial_no,
                pts_chest_no,
                svspa_rc_lrc_no,
                wbp_id,
                name,
                father_name,
                date_of_birth,
                marital_status,
                village_city,
                post_office,
                police_station,
                pin_code,
                home_district,
                home_police_station,
                recruited_unit,
                salary_drawing_unit,
                education,
                religion,
                caste,
                exempted_category,
                driving_licence,
                driving_licence_details,
                computer_knowledge,
                extracurricular_activities,
                mobile_no,
                remarks,
                legacy_leave_details,
                created_at,
                updated_at
            FROM personnel
            ${paginationWhereClause}
            ORDER BY personnel_id ASC
            LIMIT ?
        `;

        // Fetch one extra record to determine hasMore
        paginationValues.push(limit + 1);

        const [rows] = await pool.execute(
            query,
            paginationValues
        );

        // -----------------------------------------
        // 5. Determine pagination
        // -----------------------------------------

        const hasMore = rows.length > limit;

        const data = hasMore
            ? rows.slice(0, limit)
            : rows;

        let nextCursor = null;

        if (hasMore && data.length > 0) {
            const lastRecord = data[data.length - 1];

            nextCursor = encodeCursor({
                personnel_id: lastRecord.personnel_id,
            });
        }

        // -----------------------------------------
        // 6. Response
        // -----------------------------------------

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                limit,
                total,
                hasMore,
                nextCursor,
            },
        });

    } catch (error) {
        next(error);
    }
};


// --------------------------------------------------
// GET SINGLE PERSONNEL
// --------------------------------------------------

const getPersonnelById = async (req, res, next) => {
    try {
        const { personnel_id } = req.params;

        if (
            !Number.isInteger(Number(personnel_id)) ||
            Number(personnel_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid personnel ID.",
            });
        }

        const [rows] = await pool.execute(
            `
                SELECT *
                FROM personnel
                WHERE personnel_id = ?
                LIMIT 1
            `,
            [personnel_id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Personnel record not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0],
        });

    } catch (error) {
        next(error);
    }
};

// --------------------------------------------------
// UPDATE PERSONNEL
// --------------------------------------------------

const updatePersonnel = async (req, res, next) => {
    try {
        const { personnel_id } = req.params;

        if (
            !Number.isInteger(Number(personnel_id)) ||
            Number(personnel_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid personnel ID.",
            });
        }

        const {
            serial_no,
            pts_chest_no,
            svspa_rc_lrc_no,
            wbp_id,
            name,
            father_name,
            date_of_birth,
            marital_status,
            village_city,
            post_office,
            police_station,
            pin_code,
            home_district,
            home_police_station,
            recruited_unit,
            salary_drawing_unit,
            education,
            religion,
            caste,
            exempted_category,
            driving_licence,
            computer_knowledge,
            extracurricular_activities,
            mobile_no,
            remarks,
            legacy_leave_details,
        } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Personnel name is required.",
            });
        }

        // Validate DOB
        let formattedDob = null;

        if (date_of_birth) {
            const dob = String(date_of_birth).slice(0, 10);

            if (!isValidDate(dob)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid date of birth.",
                });
            }

            formattedDob = dob;
        }

        // Validate serial number
        const formattedSerialNo =
            serial_no === "" || serial_no === null || serial_no === undefined
                ? null
                : Number(serial_no);

        if (
            formattedSerialNo !== null &&
            !Number.isInteger(formattedSerialNo)
        ) {
            return res.status(400).json({
                success: false,
                message: "Serial number must be a valid integer.",
            });
        }

        const [existing] = await pool.execute(
            `
                SELECT personnel_id
                FROM personnel
                WHERE personnel_id = ?
                LIMIT 1
            `,
            [personnel_id]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Personnel record not found.",
            });
        }

        const updateQuery = `
            UPDATE personnel
            SET
                serial_no = ?,
                pts_chest_no = ?,
                svspa_rc_lrc_no = ?,
                wbp_id = ?,
                name = ?,
                father_name = ?,
                date_of_birth = ?,
                marital_status = ?,
                village_city = ?,
                post_office = ?,
                police_station = ?,
                pin_code = ?,
                home_district = ?,
                home_police_station = ?,
                recruited_unit = ?,
                salary_drawing_unit = ?,
                education = ?,
                religion = ?,
                caste = ?,
                exempted_category = ?,
                driving_licence = ?,
                computer_knowledge = ?,
                extracurricular_activities = ?,
                mobile_no = ?,
                remarks = ?,
                legacy_leave_details = ?
            WHERE personnel_id = ?
        `;

        const [result] = await pool.execute(updateQuery, [
            formattedSerialNo,
            pts_chest_no || null,
            svspa_rc_lrc_no || null,
            wbp_id || null,
            String(name).trim(),
            father_name || null,
            formattedDob,
            marital_status || null,
            village_city || null,
            post_office || null,
            police_station || null,
            pin_code || null,
            home_district || null,
            home_police_station || null,
            recruited_unit || null,
            salary_drawing_unit || null,
            education || null,
            religion || null,
            caste || null,
            exempted_category || null,
            driving_licence || null,
            computer_knowledge || null,
            extracurricular_activities || null,
            mobile_no || null,
            remarks || null,
            legacy_leave_details || null,
            personnel_id,
        ]);

        return res.status(200).json({
            success: true,
            message: "Personnel details updated successfully.",
            data: {
                personnel_id: Number(personnel_id),
                affectedRows: result.affectedRows,
            },
        });

    } catch (error) {
        next(error);
    }
};

// ==================================================
// LEAVE CONTROLLERS
// ==================================================

// --------------------------------------------------
// GET ALL LEAVES - CURSOR PAGINATION
// --------------------------------------------------

const getAllLeaves = async (req, res, next) => {
    try {
        const {
            search = "",
            district = "",
            recruited_unit = "",
            personnel_id = "",
            from_date = "",
            to_date = "",
            remarks = "",
            cursor,
        } = req.query;

        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 20, 1),
            100
        );

        const conditions = [];
        const values = [];

        // Search personnel
        if (search.trim()) {
            conditions.push(`
                (
                    p.name LIKE ?
                    OR p.wbp_id LIKE ?
                    OR p.pts_chest_no LIKE ?
                )
            `);

            const searchValue = `%${search.trim()}%`;

            values.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        // District filter
        if (district.trim()) {
            conditions.push("p.home_district = ?");
            values.push(district.trim());
        }

        // Recruited unit filter
        if (recruited_unit.trim()) {
            conditions.push("p.recruited_unit = ?");
            values.push(recruited_unit.trim());
        }

        // Personnel ID filter
        if (
            personnel_id !== undefined &&
            personnel_id !== null &&
            String(personnel_id).trim() !== ""
        ) {
            const parsedPersonnelId = String(personnel_id).trim();

            if (!/^[1-9]\d*$/.test(parsedPersonnelId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid personnel ID.",
                });
            }

            conditions.push("pl.personnel_id = ?");
            values.push(Number(parsedPersonnelId));
        }

        // From date filter
        if (from_date) {
            if (!isValidDate(from_date)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid from_date. Use YYYY-MM-DD format.",
                });
            }

            conditions.push("pl.to_date >= ?");
            values.push(from_date);
        }

        // To date filter
        if (to_date) {
            if (!isValidDate(to_date)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid to_date. Use YYYY-MM-DD format.",
                });
            }

            conditions.push("pl.from_date <= ?");
            values.push(to_date);
        }

        // Remarks filter
        if (remarks.trim()) {
            conditions.push("pl.remarks LIKE ?");
            values.push(`%${remarks.trim()}%`);
        }

        // Cursor pagination
        if (cursor) {
            const decodedCursor = decodeLeaveCursor(cursor);

            if (!decodedCursor) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pagination cursor.",
                });
            }

            conditions.push(`
                (
                    pl.from_date < ?
                    OR (
                        pl.from_date = ?
                        AND pl.leave_id < ?
                    )
                )
            `);

            values.push(
                decodedCursor.from_date,
                decodedCursor.from_date,
                decodedCursor.leave_id
            );
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const query = `
            SELECT
                pl.leave_id,
                pl.personnel_id,
                DATE_FORMAT(pl.from_date, '%Y-%m-%d') AS from_date,
                DATE_FORMAT(pl.to_date, '%Y-%m-%d') AS to_date,
                pl.from_time_period,
                pl.to_time_period,
                pl.remarks,
                pl.created_at,
                pl.updated_at,

                p.serial_no,
                p.pts_chest_no,
                p.wbp_id,
                p.name,
                p.home_district,
                p.recruited_unit

            FROM personnel_leaves pl

            INNER JOIN personnel p
                ON p.personnel_id = pl.personnel_id

            ${whereClause}

            ORDER BY
                pl.from_date DESC,
                pl.leave_id DESC

            LIMIT ?
        `;

        values.push(limit + 1);

        const [rows] = await pool.execute(query, values);

        const hasMore = rows.length > limit;

        const data = hasMore
            ? rows.slice(0, limit)
            : rows;

        let nextCursor = null;

        if (hasMore && data.length > 0) {
            const lastRecord = data[data.length - 1];

            nextCursor = encodeCursor({
                from_date: formatDate(lastRecord.from_date),
                leave_id: lastRecord.leave_id,
            });
        }

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                limit,
                hasMore,
                nextCursor,
            },
        });

    } catch (error) {
        next(error);
    }
};

// --------------------------------------------------
// GET SINGLE LEAVE
// --------------------------------------------------

// const getLeaveById = async (req, res, next) => {
//     try {
//         const { leave_id } = req.params;

//         if (
//             !Number.isInteger(Number(leave_id)) ||
//             Number(leave_id) <= 0
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid leave ID.",
//             });
//         }

//         const [rows] = await pool.execute(
//     `
//         SELECT
//             pl.leave_id,
//             pl.personnel_id,
//             DATE_FORMAT(pl.from_date, '%Y-%m-%d') AS from_date,
//             DATE_FORMAT(pl.to_date, '%Y-%m-%d') AS to_date,
//             pl.from_time,
//             pl.to_time,
//             pl.remarks,
//             pl.created_at,
//             pl.updated_at,

//             p.serial_no,
//             p.pts_chest_no,
//             p.wbp_id,
//             p.name,
//             p.home_district,
//             p.recruited_unit

//         FROM personnel_leaves pl

//         INNER JOIN personnel p
//             ON p.personnel_id = pl.personnel_id

//         WHERE pl.leave_id = ?

//         LIMIT 1
//     `,
//     [leave_id]
// );

//         if (!rows.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Leave record not found.",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             data: rows[0],
//         });

//     } catch (error) {
//         next(error);
//     }
// };
const getLeaveById = async (req, res, next) => {
    try {
        const { leave_id } = req.params;

        if (
            !Number.isInteger(Number(leave_id)) ||
            Number(leave_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID.",
            });
        }

        const [rows] = await pool.execute(
            `
                SELECT
                    pl.leave_id,
                    pl.personnel_id,
                    DATE_FORMAT(pl.from_date, '%Y-%m-%d') AS from_date,
                    DATE_FORMAT(pl.to_date, '%Y-%m-%d') AS to_date,
                    pl.from_time_period,
                    pl.to_time_period,
                    pl.remarks,
                    pl.created_at,
                    pl.updated_at,

                    p.serial_no,
                    p.pts_chest_no,
                    p.wbp_id,
                    p.name,
                    p.home_district,
                    p.recruited_unit

                FROM personnel_leaves pl

                INNER JOIN personnel p
                    ON p.personnel_id = pl.personnel_id

                WHERE pl.leave_id = ?

                LIMIT 1
            `,
            [leave_id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Leave record not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0],
        });

    } catch (error) {
        next(error);
    }
};

// --------------------------------------------------
// ADD LEAVE
// --------------------------------------------------

// const addLeave = async (req, res, next) => {
//     try {
//         const {
//             personnel_id,
//             from_date,
//             to_date,
//             from_time,
//             to_time,
//             remarks,
//         } = req.body;

//         const validationError = validateLeaveData({
//             personnel_id,
//             from_date,
//             to_date,
//             from_time,
//             to_time,
//             remarks,
//         });

//         if (validationError) {
//             return res.status(400).json({
//                 success: false,
//                 message: validationError,
//             });
//         }

//         // Check personnel exists
//         const [personnel] = await pool.execute(
//             `
//                 SELECT personnel_id
//                 FROM personnel
//                 WHERE personnel_id = ?
//                 LIMIT 1
//             `,
//             [personnel_id]
//         );

//         if (!personnel.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Personnel record not found.",
//             });
//         }

//         const [result] = await pool.execute(
//             `
//                 INSERT INTO personnel_leaves (
//                     personnel_id,
//                     from_date,
//                     to_date,
//                     from_time,
//                     to_time,
//                     remarks
//                 )
//                 VALUES (?, ?, ?, ?, ?, ?)
//             `,
//             [
//                 Number(personnel_id),
//                 from_date,
//                 to_date,
//                 from_time || null,
//                 to_time || null,
//                 String(remarks).trim(),
//             ]
//         );

//         return res.status(201).json({
//             success: true,
//             message: "Leave added successfully.",
//             data: {
//                 leave_id: result.insertId,
//                 personnel_id: Number(personnel_id),
//             },
//         });

//     } catch (error) {
//         next(error);
//     }
// };
const addLeave = async (req, res, next) => {
    try {
        const {
            personnel_id,
            from_date,
            to_date,
            from_time_period,
            to_time_period,
            remarks,
        } = req.body;

        const validationError = validateLeaveData({
            personnel_id,
            from_date,
            to_date,
            from_time_period,
            to_time_period,
            remarks,
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // Check personnel exists
        const [personnel] = await pool.execute(
            `
                SELECT personnel_id
                FROM personnel
                WHERE personnel_id = ?
                LIMIT 1
            `,
            [personnel_id]
        );

        if (!personnel.length) {
            return res.status(404).json({
                success: false,
                message: "Personnel record not found.",
            });
        }

        // Insert leave
        const [result] = await pool.execute(
            `
                INSERT INTO personnel_leaves (
                    personnel_id,
                    from_date,
                    to_date,
                    from_time_period,
                    to_time_period,
                    remarks
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(personnel_id),
                from_date,
                to_date,
                from_time_period,
                to_time_period,
                String(remarks).trim(),
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Leave added successfully.",
            data: {
                leave_id: result.insertId,
                personnel_id: Number(personnel_id),
            },
        });

    } catch (error) {
        next(error);
    }
};
// --------------------------------------------------
// UPDATE LEAVE
// --------------------------------------------------

// const updateLeave = async (req, res, next) => {
//     try {
//         const { leave_id } = req.params;

//         if (
//             !Number.isInteger(Number(leave_id)) ||
//             Number(leave_id) <= 0
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid leave ID.",
//             });
//         }

//         const {
//             personnel_id,
//             from_date,
//             to_date,
//             from_time,
//             to_time,
//             remarks,
//         } = req.body;

//         const validationError = validateLeaveData({
//             personnel_id,
//             from_date,
//             to_date,
//             from_time,
//             to_time,
//             remarks,
//         });

//         if (validationError) {
//             return res.status(400).json({
//                 success: false,
//                 message: validationError,
//             });
//         }

//         // Check leave exists
//         const [existingLeave] = await pool.execute(
//             `
//                 SELECT leave_id
//                 FROM personnel_leaves
//                 WHERE leave_id = ?
//                 LIMIT 1
//             `,
//             [leave_id]
//         );

//         if (!existingLeave.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Leave record not found.",
//             });
//         }

//         // Check personnel exists
//         const [personnel] = await pool.execute(
//             `
//                 SELECT personnel_id
//                 FROM personnel
//                 WHERE personnel_id = ?
//                 LIMIT 1
//             `,
//             [personnel_id]
//         );

//         if (!personnel.length) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Personnel record not found.",
//             });
//         }

//         const [result] = await pool.execute(
//             `
//                 UPDATE personnel_leaves
//                 SET
//                     personnel_id = ?,
//                     from_date = ?,
//                     to_date = ?,
//                     from_time = ?,
//                     to_time = ?,
//                     remarks = ?
//                 WHERE leave_id = ?
//             `,
//             [
//                 Number(personnel_id),
//                 from_date,
//                 to_date,
//                 from_time || null,
//                 to_time || null,
//                 String(remarks).trim(),
//                 leave_id,
//             ]
//         );

//         return res.status(200).json({
//             success: true,
//             message: "Leave updated successfully.",
//             data: {
//                 leave_id: Number(leave_id),
//                 affectedRows: result.affectedRows,
//             },
//         });

//     } catch (error) {
//         next(error);
//     }
// };
const updateLeave = async (req, res, next) => {
    try {
        const { leave_id } = req.params;

        if (
            !Number.isInteger(Number(leave_id)) ||
            Number(leave_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID.",
            });
        }

        const {
            personnel_id,
            from_date,
            to_date,
            from_time_period,
            to_time_period,
            remarks,
        } = req.body;

        const validationError = validateLeaveData({
            personnel_id,
            from_date,
            to_date,
            from_time_period,
            to_time_period,
            remarks,
        });

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        // Check leave exists
        const [existingLeave] = await pool.execute(
            `
                SELECT leave_id
                FROM personnel_leaves
                WHERE leave_id = ?
                LIMIT 1
            `,
            [leave_id]
        );

        if (!existingLeave.length) {
            return res.status(404).json({
                success: false,
                message: "Leave record not found.",
            });
        }

        // Check personnel exists
        const [personnel] = await pool.execute(
            `
                SELECT personnel_id
                FROM personnel
                WHERE personnel_id = ?
                LIMIT 1
            `,
            [personnel_id]
        );

        if (!personnel.length) {
            return res.status(404).json({
                success: false,
                message: "Personnel record not found.",
            });
        }

        // Update leave
        const [result] = await pool.execute(
            `
                UPDATE personnel_leaves
                SET
                    personnel_id = ?,
                    from_date = ?,
                    to_date = ?,
                    from_time_period = ?,
                    to_time_period = ?,
                    remarks = ?
                WHERE leave_id = ?
            `,
            [
                Number(personnel_id),
                from_date,
                to_date,
                from_time_period,
                to_time_period,
                String(remarks).trim(),
                leave_id,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Leave updated successfully.",
            data: {
                leave_id: Number(leave_id),
                affectedRows: result.affectedRows,
            },
        });

    } catch (error) {
        next(error);
    }
};
// --------------------------------------------------
// DELETE LEAVE
// --------------------------------------------------

const deleteLeave = async (req, res, next) => {
    try {
        const { leave_id } = req.params;

        if (
            !Number.isInteger(Number(leave_id)) ||
            Number(leave_id) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave ID.",
            });
        }

        const [result] = await pool.execute(
            `
                DELETE FROM personnel_leaves
                WHERE leave_id = ?
            `,
            [leave_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave record not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Leave deleted successfully.",
            data: {
                leave_id: Number(leave_id),
            },
        });

    } catch (error) {
        next(error);
    }
};

// ==================================================
// EXPORT ALL CONTROLLERS
// ==================================================

export {
    // Personnel
    getAllPersonnel,
    getPersonnelById,
    updatePersonnel,

    // Leaves
    getAllLeaves,
    getLeaveById,
    addLeave,
    updateLeave,
    deleteLeave,
};