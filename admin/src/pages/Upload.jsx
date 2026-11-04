import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import * as XLSX from "xlsx";

import {
  Download,
  Upload,
  FileSpreadsheet,
  FileUp,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  Loader2,
} from "lucide-react";

import { useUploadPersonnelExcelMutation } from "@/redux/api/uploadApi";
import { personnelApi } from "@/redux/api/personnelApi";

const TEMPLATE_URL = "/assets/personnel_import_template.xlsx";

const ORIGINAL_HEADERS = [
  "Sl. \nNo.",
  "PTS Chest No.",
  "SVSPA Allotted RC/LRC No",
  "Name of the RC/LRC",
  "Father's Name",
  "Vill/City",
  "Post Office",
  "Police Station",
  "Pin",
  "Home District",
  "Home District",
  "Home Police Station",
  "WBP ID",
  "Name of the Dist/Unit from where Recruited/Appointed",
  "Name of the Dist/Unit from where Salary is being drawn",
  "Date of Birth\n(DD/MM/YYYY)",
  "Marital Status (Married\n/Unmarried/Widow)",
  "Educational \nQualification",
  "Religion",
  "Caste",
  "Exampted Category (Yes/No)",
  "Driving  Licence (Yes/No)",
  "Driving Licence  If Yes then mention the Type of D/L and D/L Number",
  "Computer Knowledge, if Any mention",
  "Extracurricular activities",
  "Leave",
  "Mobile No.",
  "Remarks",
];

const COLUMN_KEYS = [
  "serial_no",
  "pts_chest_no",
  "svspa_allotted_rc_lrc_no",
  "name",
  "father_name",
  "village_city",
  "post_office",
  "police_station",
  "pin",
  "home_district_1",
  "home_district_2",
  "home_police_station",
  "wbp_id",
  "recruited_unit",
  "salary_drawing_unit",
  "date_of_birth",
  "marital_status",
  "education",
  "religion",
  "caste",
  "exempted_category",
  "driving_licence",
  "driving_licence_details",
  "computer_knowledge",
  "extracurricular_activities",
  "legacy_leave_details",
  "mobile_no",
  "remarks",
];

const normalizeHeader = (value) =>
  String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Supports DD/MM/YY and DD/MM/YYYY.
// 00-26 => 2000-2026
// 27-99 => 1927-1999
const parseDob = (value) => {
  if (value === null || value === undefined || value === "") {
    return { valid: true, formatted: "" };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { valid: false, formatted: "" };
    }

    const day = value.getDate();
    const month = value.getMonth() + 1;
    const year = value.getFullYear();

    return {
      valid: true,
      formatted: `${String(day).padStart(2, "0")}/${String(
        month
      ).padStart(2, "0")}/${year}`,
    };
  }

  const text = String(value).trim();

  const match = text.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/
  );

  if (!match) {
    return { valid: false, formatted: "" };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);

  if (match[3].length === 2) {
    year += year <= 26 ? 2000 : 1900;
  }

  if (
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1000
  ) {
    return { valid: false, formatted: "" };
  }

  const date = new Date(year, month - 1, day);

  const valid =
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day;

  return {
    valid,
    formatted: valid
      ? `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`
      : "",
  };
};

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");

    return `${day}/${month}/${value.getFullYear()}`;
  }

  return String(value).trim();
};

const validateHeaders = (actualHeaders) => {
  const errors = [];

  if (actualHeaders.length !== ORIGINAL_HEADERS.length) {
    errors.push(
      `Expected ${ORIGINAL_HEADERS.length} columns, but found ${actualHeaders.length}.`
    );
  }

  ORIGINAL_HEADERS.forEach((expected, index) => {
    const actual = actualHeaders[index] ?? "";

    if (normalizeHeader(actual) !== normalizeHeader(expected)) {
      errors.push(
        `Column ${index + 1}: expected "${expected.replace(
          /\n/g,
          " "
        )}", but found "${actual}".`
      );
    }
  });

  return errors;
};

const validateRows = (rows) => {
  const errors = [];

  rows.forEach((row, index) => {
    const excelRowNumber = index + 2;

    if (!row.name) {
      errors.push(
        `Row ${excelRowNumber}: Name of the RC/LRC is required.`
      );
    }

    if (
      row.date_of_birth &&
      !parseDob(row.date_of_birth).valid
    ) {
      errors.push(
        `Row ${excelRowNumber}: Invalid Date of Birth (${row.date_of_birth}). Expected DD/MM/YY or DD/MM/YYYY.`
      );
    }

    if (
      row.mobile_no &&
      !/^[0-9+\-\s]{7,20}$/.test(row.mobile_no)
    ) {
      errors.push(
        `Row ${excelRowNumber}: Mobile No. is invalid.`
      );
    }
  });

  return errors;
};

const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error(
      "The Excel file does not contain a worksheet."
    );
  }

  const worksheet = workbook.Sheets[firstSheetName];

  // Read as arrays to preserve duplicate Home District headings.
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!matrix.length) {
    throw new Error("The Excel worksheet is empty.");
  }

  const actualHeaders = matrix[0].map((header) =>
    String(header ?? "")
  );

  const headerErrors = validateHeaders(actualHeaders);

  if (headerErrors.length) {
    return {
      rows: [],
      headerErrors,
      rowErrors: [],
    };
  }

  const rows = matrix
    .slice(1)
    .filter((row) =>
      row.some(
        (cell) => String(cell ?? "").trim() !== ""
      )
    )
    .map((row) => {
      const record = {};

      COLUMN_KEYS.forEach((key, index) => {
        record[key] = normalizeCellValue(row[index]);
      });

      // Normalize DOB before validation.
      if (record.date_of_birth) {
        const dob = parseDob(record.date_of_birth);

        if (dob.valid) {
          record.date_of_birth = dob.formatted;
        }
      }

      return record;
    });

  return {
    rows,
    headerErrors: [],
    rowErrors: validateRows(rows),
  };
};

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <h3 className="mt-2 text-2xl font-bold text-gray-900">
          {value}
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>
      </div>

      <div className="rounded-xl bg-blue-50 p-3">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
  </div>
);

const UploadPersonnel = ({ personnel = [] }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fileInputRef = useRef(null);

  const [uploadPersonnelExcel, { isLoading: isImporting }] =
    useUploadPersonnelExcelMutation();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [totalRows, setTotalRows] = useState(0);
  const [headerErrors, setHeaderErrors] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);

  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetUpload = () => {
    setSelectedFile(null);
    setTotalRows(0);
    setHeaderErrors([]);
    setRowErrors([]);
    setIsValidated(false);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (file) => {
    setErrorMessage("");
    setTotalRows(0);
    setHeaderErrors([]);
    setRowErrors([]);
    setIsValidated(false);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setSelectedFile(null);
      setErrorMessage(
        "Please select an Excel file (.xlsx or .xls)."
      );
      return;
    }

    setSelectedFile(file);

    try {
      const result = await parseExcelFile(file);

      setHeaderErrors(result.headerErrors);
      setRowErrors(result.rowErrors);
      setTotalRows(result.rows.length);

      if (result.headerErrors.length) {
        setErrorMessage(
          "The Excel headings do not match the original personnel format. Please download and use the sample template."
        );
        return;
      }

      if (!result.rows.length) {
        setErrorMessage(
          "No personnel data rows were found in this file."
        );
        return;
      }

      if (result.rowErrors.length) {
        setErrorMessage(
          "Some rows contain validation errors. Please correct them before importing."
        );
        return;
      }

      setIsValidated(true);
    } catch (error) {
      console.error("Excel parsing error:", error);

      setErrorMessage(
        "Unable to read this Excel file. Please check the file."
      );
    }
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.type === "dragenter" ||
      event.type === "dragover"
    ) {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleImport = async () => {
    if (
      !selectedFile ||
      !isValidated ||
      isImporting
    ) {
      return;
    }

    try {
      setErrorMessage("");

      // Upload original Excel file.
      await uploadPersonnelExcel(selectedFile).unwrap();

      // Invalidate cached personnel and leave lists.
      dispatch(
        personnelApi.util.invalidateTags([
          { type: "Personnel", id: "LIST" },
          { type: "Leave", id: "LIST" },
        ])
      );

      // Navigate immediately after successful import.
      navigate("/leave", { replace: true });
    } catch (error) {
      console.error("Personnel import error:", error);

      setErrorMessage(
        error?.data?.message ||
          error?.error ||
          error?.message ||
          "Personnel import failed. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Upload  Database
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage personnel biodata and import records from Excel.
        </p>
      </div>

      {/* Statistics */}
      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Personnel"
          value={personnel.length}
          icon={Users}
          description="Total personnel records"
        />

        <StatCard
          title="Active Personnel"
          value={
            personnel.filter(
              (person) => person.is_active !== 0
            ).length
          }
          icon={CheckCircle2}
          description="Currently active records"
        />

        <StatCard
          title="Excel Records"
          value={totalRows}
          icon={FileSpreadsheet}
          description="Records detected in selected file"
        />
      </div> */}

      {/* Download and Upload */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Download Template */}
        <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Download Sample Excel
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Download the original  format before
                preparing your personnel records.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <a
    href={TEMPLATE_URL}
    download="personnel_import_template.xlsx"
    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
>
              <Download className="h-4 w-4" />
              Download Sample Excel
            </a>
          </div>
        </div>

        {/* Upload Excel */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <FileUp className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Upload  Excel
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select your completed  Excel file.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleInputChange}
          />

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className={`mt-5 flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <div className="rounded-full bg-blue-100 p-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-800">
                Click to upload or drag and drop
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Excel files only (.xlsx, .xls)
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={isImporting}
                  className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-red-600 disabled:opacity-50"
                  title="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {totalRows} records detected
                </span>

                {isValidated && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Validated
                  </span>
                )}
              </div>

              {/* Import button stays inside the upload card */}
              <button
                type="button"
                onClick={handleImport}
                disabled={
                  isImporting ||
                  !isValidated ||
                  headerErrors.length > 0 ||
                  rowErrors.length > 0
                }
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import 
                  </>
                )}
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            Please use the downloaded template to avoid heading mismatch.
          </p>
        </div>
      </div>

      {/* Only show errors when validation or import fails */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>

          {(headerErrors.length > 0 ||
            rowErrors.length > 0) && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {headerErrors.slice(0, 10).map((error, index) => (
                <li key={`header-${index}`}>{error}</li>
              ))}

              {rowErrors.slice(0, 10).map((error, index) => (
                <li key={`row-${index}`}>{error}</li>
              ))}

              {headerErrors.length + rowErrors.length > 10 && (
                <li>
                  And{" "}
                  {headerErrors.length +
                    rowErrors.length -
                    10}{" "}
                  more validation errors.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadPersonnel;