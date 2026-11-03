// controllers/uploadController.js

import XLSX from "xlsx";
import db from "../../config/db.js";

// Normalize Excel headings so differences in casing, spaces and line breaks
// do not prevent matching.
const normalizeHeader = (value = "") =>
    String(value)
        .toLowerCase()
        .replace(/\r?\n/g, " ")
        .replace(/[^a-z0-9]/g, "")
        .trim();

// Convert Excel date values into MySQL DATE format.
// const formatExcelDate = (value) => {
//     if (value === null || value === undefined || value === "") {
//         return null;
//     }

//     // Excel date stored as a numeric serial.
//     if (typeof value === "number") {
//         const parsed = XLSX.SSF.parse_date_code(value);

//         if (!parsed) return null;

//         const month = String(parsed.m).padStart(2, "0");
//         const day = String(parsed.d).padStart(2, "0");

//         return `${parsed.y}-${month}-${day}`;
//     }

//     // JavaScript Date object.
//     if (value instanceof Date && !Number.isNaN(value.getTime())) {
//         const year = value.getFullYear();
//         const month = String(value.getMonth() + 1).padStart(2, "0");
//         const day = String(value.getDate()).padStart(2, "0");

//         return `${year}-${month}-${day}`;
//     }

//     // Text date: try common formats.
//     const text = String(value).trim();

//     if (!text) return null;

//     // DD/MM/YYYY or DD-MM-YYYY
//     const dmyMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

//     if (dmyMatch) {
//         const [, day, month, year] = dmyMatch;

//         return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//     }

//     // YYYY-MM-DD
//     const ymdMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

//     if (ymdMatch) {
//         const [, year, month, day] = ymdMatch;

//         return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
//     }

//     return null;
// };
// Validate date and return MySQL DATE format: YYYY-MM-DD
const buildValidDate = (year, month, day) => {
    year = Number(year);
    month = Number(month);
    day = Number(day);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        year < 1000 ||
        year > 9999 ||
        month < 1 ||
        month > 12 ||
        day < 1
    ) {
        return null;
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    if (day > daysInMonth) {
        return null;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Convert Excel dates and text dates into MySQL DATE format.
const formatExcelDate = (value) => {
    try {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        // Excel numeric serial date
        if (typeof value === "number") {
            const parsed = XLSX.SSF.parse_date_code(value);

            if (!parsed) return null;

            return buildValidDate(parsed.y, parsed.m, parsed.d);
        }

        // JavaScript Date object
        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) return null;

            return buildValidDate(
                value.getFullYear(),
                value.getMonth() + 1,
                value.getDate()
            );
        }

        const text = String(value).trim();

        if (!text) return null;

        // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
        // Also supports single digit day/month: D-M-YYYY
        const dmyMatch = text.match(
            /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/
        );

        if (dmyMatch) {
            const [, day, month, year] = dmyMatch;

            return buildValidDate(year, month, day);
        }

        // YYYY-MM-DD or YYYY/MM/DD
        const ymdMatch = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
        );

        if (ymdMatch) {
            const [, year, month, day] = ymdMatch;

            return buildValidDate(year, month, day);
        }

        // Unsupported or invalid format
        return null;

    } catch (error) {
        // Never allow an invalid Excel date to crash the import.
        return null;
    }
};
const cleanValue = (value) => {
    if (value === null || value === undefined) return null;

    const text = String(value).trim();

    return text === "" ? null : text;
};

// Find a column by possible heading names.
// occurrence is useful for duplicate headings such as Home District.
const findColumnIndex = (headers, aliases, occurrence = 0) => {
    const normalizedAliases = aliases.map(normalizeHeader);

    const matchingIndexes = [];

    headers.forEach((header, index) => {
        if (normalizedAliases.includes(normalizeHeader(header))) {
            matchingIndexes.push(index);
        }
    });

    return matchingIndexes[occurrence] ?? -1;
};

const getCellValue = (row, headers, aliases, occurrence = 0) => {
    const index = findColumnIndex(headers, aliases, occurrence);

    if (index === -1) return null;

    return cleanValue(row[index]);
};

const uploadPersonnelExcel = async (req, res, next) => {
    const connection = await db.getConnection();

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file.",
            });
        }

        const allowedMimeTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/octet-stream",
        ];

        const extension = req.file.originalname
            .split(".")
            .pop()
            .toLowerCase();

        if (!["xlsx", "xls"].includes(extension)) {
            return res.status(400).json({
                success: false,
                message: "Only .xlsx and .xls files are allowed.",
            });
        }

        const workbook = XLSX.readFile(req.file.path, {
    cellDates: true,
});
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            return res.status(400).json({
                success: false,
                message: "The uploaded Excel file has no worksheet.",
            });
        }

        const worksheet = workbook.Sheets[sheetName];

        // Use header: 1 to preserve duplicate column headings.
        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            raw: true,
            blankrows: false,
        });

        if (rows.length < 2) {
            return res.status(400).json({
                success: false,
                message: "The Excel file does not contain personnel records.",
            });
        }

        const headers = rows[0];

        // Check that the important columns exist.
        const nameColumn = findColumnIndex(headers, [
    "Name",
    "Name of the RC/LRC",
    "Name of RC/LRC",
]);

        if (nameColumn === -1) {
            return res.status(400).json({
                success: false,
                message: "The Excel file must contain a Name column.",
            });
        }

        const personnelRows = rows.slice(1);

        let importedRows = 0;
        let skippedRows = 0;

        await connection.beginTransaction();

        const insertQuery = `
            INSERT INTO personnel (
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
                legacy_leave_details
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (let index = 0; index < personnelRows.length; index++) {
            const row = personnelRows[index];

            if (!row || row.every((cell) => cleanValue(cell) === null)) {
                skippedRows++;
                continue;
            }

           const name = getCellValue(row, headers, [
    "Name",
    "Name of the RC/LRC",
    "Name of RC/LRC",
]);

            // Name is required in your personnel table.
            if (!name) {
                skippedRows++;
                continue;
            }

            const serialValue = getCellValue(row, headers, [
                "Sl No",
                "Serial No",
                "Sl. No.",
                "Serial Number",
            ]);

            const serialNo = serialValue
                ? Number.parseInt(serialValue, 10)
                : null;

            const dobColumn = findColumnIndex(headers, [
                "Date of Birth",
                "DOB",
                "D.O.B",
            ]);

            const dateOfBirth =
                dobColumn !== -1
                    ? formatExcelDate(row[dobColumn])
                    : null;

            const values = [
                Number.isInteger(serialNo) ? serialNo : null,

                getCellValue(row, headers, [
                    "PTS Chest No",
                    "PTS Chest Number",
                    "Chest No",
                ]),

                getCellValue(row, headers, [
                    "SVSPA RC/LRC No",
                    "SVSPA RC LRC No",
                    "RC/LRC No",
                    "RC LRC No",
                ]),

                getCellValue(row, headers, ["WBP ID", "WBP ID No"]),

                name,

                getCellValue(row, headers, [
                    "Father Name",
                    "Father's Name",
                    "Name of Father",
                ]),

                dateOfBirth,

                getCellValue(row, headers, ["Marital Status"]),

                getCellValue(row, headers, [
                    "Village/City",
                    "Village City",
                    "Village",
                ]),

                getCellValue(row, headers, ["Post Office", "PO"]),

                getCellValue(row, headers, [
                    "Police Station",
                    "P.S.",
                    "PS",
                ]),

                getCellValue(row, headers, ["PIN Code", "Pin", "PIN"]),

                // First Home District heading.
                getCellValue(row, headers, ["Home District"], 0),

                // Second duplicate Home District heading.
                // This is mapped to home_police_station in the agreed schema.
                getCellValue(row, headers, ["Home District"], 1),

                getCellValue(row, headers, [
                    "Recruited Unit",
                    "Unit of Recruitment",
                ]),

                getCellValue(row, headers, [
                    "Salary Drawing Unit",
                    "Salary Drawn Unit",
                ]),

                getCellValue(row, headers, ["Education", "Educational Qualification"]),

                getCellValue(row, headers, ["Religion"]),

                getCellValue(row, headers, ["Caste"]),

                getCellValue(row, headers, [
                    "Exempted Category",
                    "Exempted Category (if any)",
                ]),

                getCellValue(row, headers, [
                    "Driving Licence",
                    "Driving License",
                ]),

                getCellValue(row, headers, [
                    "Computer Knowledge",
                    "Knowledge of Computer",
                ]),

                getCellValue(row, headers, [
                    "Extra Curricular Activities",
                    "Extracurricular Activities",
                ]),

                getCellValue(row, headers, [
                    "Mobile No",
                    "Mobile Number",
                    "Phone No",
                ]),

                getCellValue(row, headers, ["Remarks"]),

                // Preserve the old Excel Leave column as legacy text.
                getCellValue(row, headers, ["Leave", "Leave Details"]),
            ];

            await connection.execute(insertQuery, values);

            importedRows++;
        }

        if (importedRows === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "No valid personnel records were found in the Excel file.",
                skippedRows,
            });
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Personnel Excel file imported successfully.",
            data: {
                totalRows: personnelRows.length,
                importedRows,
                skippedRows,
            },
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

export { uploadPersonnelExcel };