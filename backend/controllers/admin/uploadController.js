import XLSX from "xlsx";
import db from "../../config/db.js";
import fs from "fs/promises";

// Normalize Excel headings: casing, spaces, punctuation and line breaks.
const normalizeHeader = (value = "") =>
    String(value)
        .toLowerCase()
        .replace(/\r?\n/g, " ")
        .replace(/[^a-z0-9]/g, "")
        .trim();

// Validate a date and return MySQL DATE format.
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

    if (day > daysInMonth) return null;

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

// Convert Excel dates and text dates into MySQL DATE format.
const formatExcelDate = (value) => {
    try {
        if (value === null || value === undefined || value === "") {
            return null;
        }

        // Excel numeric serial date.
        if (typeof value === "number") {
            const parsed = XLSX.SSF.parse_date_code(value);

            if (!parsed) return null;

            return buildValidDate(parsed.y, parsed.m, parsed.d);
        }

        // JavaScript Date object.
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

        // DD-MM-YYYY, DD/MM/YYYY or DD.MM.YYYY.
        const dmyMatch = text.match(
            /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/
        );

        if (dmyMatch) {
            const [, day, month, year] = dmyMatch;
            return buildValidDate(year, month, day);
        }

        // YYYY-MM-DD or YYYY/MM/DD.
        const ymdMatch = text.match(
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
        );

        if (ymdMatch) {
            const [, year, month, day] = ymdMatch;
            return buildValidDate(year, month, day);
        }

        return null;
    } catch (error) {
        return null;
    }
};

const cleanValue = (value) => {
    if (value === null || value === undefined) return null;

    const text = String(value).trim();

    return text === "" ? null : text;
};

// Find a column by heading aliases.
// occurrence handles duplicate headings such as Home District.
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
    let connection = null;
    let transactionStarted = false;
    let importSucceeded = false;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file.",
            });
        }

        // Validate file extension.
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

        // Read the uploaded file from uploads/admin.
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

        // Matrix format preserves duplicate Home District headings.
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

        // Validate required Name column.
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

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

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
                driving_licence_details,
                computer_knowledge,
                extracurricular_activities,
                mobile_no,
                remarks,
                legacy_leave_details
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `;

        for (let index = 0; index < personnelRows.length; index++) {
            const row = personnelRows[index];

            // Ignore completely empty rows.
            if (!row || row.every((cell) => cleanValue(cell) === null)) {
                skippedRows++;
                continue;
            }

            const name = getCellValue(row, headers, [
                "Name",
                "Name of the RC/LRC",
                "Name of RC/LRC",
            ]);

            if (!name) {
                skippedRows++;
                continue;
            }

            // Serial number.
            const serialValue = getCellValue(row, headers, [
                "Sl No",
                "Serial No",
                "Sl. No.",
                "Serial Number",
            ]);

            const serialNo = serialValue
                ? Number.parseInt(serialValue, 10)
                : null;

            // Date of birth.
            const dobColumn = findColumnIndex(headers, [
                "Date of Birth",
                "DOB",
                "D.O.B",
                "Date of Birth (DD/MM/YYYY)",
            ]);

            const dateOfBirth =
                dobColumn !== -1
                    ? formatExcelDate(row[dobColumn])
                    : null;

            const values = [
                Number.isInteger(serialNo) ? serialNo : null,

                // PTS Chest No.
                getCellValue(row, headers, [
                    "PTS Chest No",
                    "PTS Chest Number",
                    "Chest No",
                ]),

                // SVSPA Allotted RC/LRC No.
                getCellValue(row, headers, [
                    "SVSPA Allotted RC/LRC No",
                    "SVSPA RC/LRC No",
                    "SVSPA RC LRC No",
                    "RC/LRC No",
                    "RC LRC No",
                ]),

                // WBP ID.
                getCellValue(row, headers, [
                    "WBP ID",
                    "WBP ID No",
                ]),

                name,

                // Father's Name.
                getCellValue(row, headers, [
                    "Father Name",
                    "Father's Name",
                    "Name of Father",
                ]),

                dateOfBirth,

                getCellValue(row, headers, [
                    "Marital Status",
                ]),

                // Village / City.
                getCellValue(row, headers, [
                    "Village/City",
                    "Village City",
                    "Vill/City",
                    "Village",
                ]),

                getCellValue(row, headers, [
                    "Post Office",
                    "PO",
                ]),

                // Present/local Police Station.
                getCellValue(row, headers, [
                    "Police Station",
                    "P.S.",
                    "PS",
                ]),

                getCellValue(row, headers, [
                    "PIN Code",
                    "Pin",
                    "PIN",
                ]),

                // Use the SECOND Home District column.
                getCellValue(row, headers, [
                    "Home District",
                ], 1),

                // Separate Home Police Station column.
                getCellValue(row, headers, [
                    "Home Police Station",
                ]),

                // Recruited Unit.
                getCellValue(row, headers, [
                    "Recruited Unit",
                    "Unit of Recruitment",
                    "Name of the Dist/Unit from where Recruited/Appointed",
                ]),

                // Salary Drawing Unit.
                getCellValue(row, headers, [
                    "Salary Drawing Unit",
                    "Salary Drawn Unit",
                    "Name of the Dist/Unit from where Salary is being drawn",
                ]),

                getCellValue(row, headers, [
                    "Education",
                    "Educational Qualification",
                ]),

                getCellValue(row, headers, [
                    "Religion",
                ]),

                getCellValue(row, headers, [
                    "Caste",
                ]),

                getCellValue(row, headers, [
                    "Exempted Category",
                    "Exampted Category (Yes/No)",
                    "Exempted Category (Yes/No)",
                ]),

                // Driving Licence Yes/No.
                getCellValue(row, headers, [
                    "Driving Licence (Yes/No)",
                    "Driving License (Yes/No)",
                ]),

                // Driving Licence type and number.
                getCellValue(row, headers, [
                    "Driving Licence If Yes then mention the Type of D/L and D/L Number",
                    "Driving License If Yes then mention the Type of D/L and D/L Number",
                    "Driving Licence Details",
                    "Driving License Details",
                ]),

                getCellValue(row, headers, [
                    "Computer Knowledge",
                    "Computer Knowledge, if Any mention",
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

                getCellValue(row, headers, [
                    "Remarks",
                ]),

                // Preserve legacy Excel Leave text.
                getCellValue(row, headers, [
                    "Leave",
                    "Leave Details",
                ]),
            ];

            await connection.execute(insertQuery, values);

            importedRows++;
        }

        if (importedRows === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "No valid personnel records were found in the Excel file.",
                skippedRows,
            });
        }

        await connection.commit();
        transactionStarted = false;

        // Keep the Excel file only after successful import.
        importSucceeded = true;

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
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Excel import rollback failed:", rollbackError);
            }
        }

        next(error);

    } finally {
        if (connection) {
            connection.release();
        }

        // Delete uploaded Excel whenever import did not succeed.
        if (!importSucceeded && req.file?.path) {
            try {
                await fs.unlink(req.file.path);
                console.log("Failed Excel upload deleted:", req.file.path);
            } catch (deleteError) {
                if (deleteError.code !== "ENOENT") {
                    console.error(
                        "Could not delete failed Excel upload:",
                        deleteError
                    );
                }
            }
        }
    }
};

export { uploadPersonnelExcel };