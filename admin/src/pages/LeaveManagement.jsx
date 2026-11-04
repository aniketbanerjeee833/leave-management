
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import VirtualList from "../components/common/VirtualList";
import {
  Search,
  CalendarDays,
  MapPin,
  Building2,
  Plus,
  X,
  Pencil,
  Clock,
  FileText,
  ChevronRight,
  UserRound,
  Save,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

import { dashboardApi } from "@/redux/api/dashboardApi";

import {
  useAddLeaveMutation,
  useDeleteLeaveMutation,
  useLazyGetAllLeavesQuery,
  useLazyGetAllPersonnelQuery,
  useLazyGetPersonnelByIdQuery,
  useUpdateLeaveMutation,
  useUpdatePersonnelMutation,
} from "@/redux/api/personnelApi";
import DeleteAlertModal from "@/components/Modal/DeleteAlertModal";

const PAGE_SIZE = 30;

const emptyLeaveForm = {
  from_date: "",
  to_date: "",
  from_time_period: "AM",
  to_time_period: "PM",
  remarks: "",
};

// --------------------------------------------------
// Personnel edit form sections
// --------------------------------------------------

const personnelSections = [
  {
    title: "Basic Information",
    description: "Personnel identification and personal details.",
    fields: [
      { name: "serial_no", label: "Serial Number", type: "number" },
      { name: "pts_chest_no", label: "PTS Chest No." },
      { name: "svspa_rc_lrc_no", label: "SVSPA RC/LRC No." },
      { name: "wbp_id", label: "WBP ID" },
      { name: "name", label: "Name", required: true },
      { name: "father_name", label: "Father's Name" },
      { name: "date_of_birth", label: "Date of Birth", type: "date" },
      { name: "marital_status", label: "Marital Status" },
    ],
  },
  {
    title: "Address Information",
    description: "Permanent address and home police station details.",
    fields: [
      { name: "village_city", label: "Village / City" },
      { name: "post_office", label: "Post Office" },
      { name: "police_station", label: "Police Station" },
      { name: "pin_code", label: "PIN Code" },
      { name: "home_district", label: "Home District" },
      { name: "home_police_station", label: "Home Police Station" },
      { name: "mobile_no", label: "Mobile Number", type: "tel" },
    ],
  },
  {
    title: "Recruitment Information",
    description: "Recruitment and salary drawing details.",
    fields: [
      { name: "recruited_unit", label: "Recruited District / Unit" },
      {
        name: "salary_drawing_unit",
        label: "Salary Drawing District / Unit",
      },
    ],
  },
  {
    title: "Education & Other Information",
    description: "Educational qualifications and other personal details.",
    fields: [
      { name: "education", label: "Education" },
      { name: "religion", label: "Religion" },
      { name: "caste", label: "Caste" },
      { name: "exempted_category", label: "Exempted Category" },
      { name: "driving_licence", label: "Driving Licence" },
      {
        name: "driving_licence_details",
        label: "Driving Licence Details (Type & Number)",
      },
      {
        name: "computer_knowledge",
        label: "Computer Knowledge",
        type: "textarea",
      },
      {
        name: "extracurricular_activities",
        label: "Extracurricular Activities",
        type: "textarea",
      },
    ],
  },
];

// --------------------------------------------------
// Reusable form field
// --------------------------------------------------

const FormField = ({ field, value, onChange }) => {
  const commonClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-400";

  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          name={field.name}
          value={value ?? ""}
          onChange={onChange}
          rows={3}
          className={`${commonClass} resize-y`}
        />
      ) : (
        <input
          type={field.type || "text"}
          name={field.name}
          value={value ?? ""}
          onChange={onChange}
          required={field.required || false}
          className={commonClass}
        />
      )}
    </div>
  );
};

// --------------------------------------------------
// API response helpers
// --------------------------------------------------

const getRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.personnel)) return response.personnel;
  if (Array.isArray(response?.leaves)) return response.leaves;
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

const getRecord = (response) =>
  response?.data?.personnel ||
  response?.data?.leave ||
  response?.data ||
  response?.personnel ||
  response?.leave ||
  response;

const getNextCursor = (response) =>
  response?.pagination?.nextCursor ??
  response?.pagination?.next_cursor ??
  response?.nextCursor ??
  response?.next_cursor ??
  response?.data?.pagination?.nextCursor ??
  response?.data?.pagination?.next_cursor ??
  response?.data?.nextCursor ??
  response?.data?.next_cursor ??
  null;

// Convert backend 24-hour time (HH:mm:ss) to a 12-hour clock value
// and its AM/PM period for the form controls.
const splitTimeForForm = (time) => {
  if (!time) return { time: "", period: "AM" };

  const [rawHours, minutes] = String(time).slice(0, 5).split(":");
  const hours = Number(rawHours);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;

  return {
    time: `${String(twelveHour).padStart(2, "0")}:${minutes}`,
    period,
  };
};

// Convert the 12-hour form value plus AM/PM into backend 24-hour time.
const toBackendTime = (time, period) => {
  if (!time) return null;

  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  if (period !== "AM" && period !== "PM") return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
};

const formatTime12Hour = (time) => {
  if (!time) return "";

  const { time: clockTime, period } = splitTimeForForm(time);
  return `${clockTime} ${period}`;
};

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function LeaveManagement() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---------------- Personnel list ----------------

  const [personnel, setPersonnel] = useState([]);
  const [personnelHasMore, setPersonnelHasMore] = useState(true);
  const [personnelLoadingMore, setPersonnelLoadingMore] = useState(false);
  const [personnelTotal, setPersonnelTotal] = useState(null);
  const [personnelLoadError, setPersonnelLoadError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    leaveId: null,
  });

  // Pagination refs
  const cursorRef = useRef(null);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // ---------------- Filters ----------------

  // Initialize filters from the URL so they survive refresh/reopen.
  const [search, setSearch] = useState(
    () => searchParams.get("search") || ""
  );
  const [leaveFromDate, setLeaveFromDate] = useState(
    () => searchParams.get("from_date") || ""
  );
  const [leaveToDate, setLeaveToDate] = useState(
    () => searchParams.get("to_date") || ""
  );

  // Keep the URL query parameters synchronized with the filter inputs.
  // replace:true prevents every keystroke from creating a browser history entry.
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      nextParams.set("search", trimmedSearch);
    } else {
      nextParams.delete("search");
    }

    if (leaveFromDate) {
      nextParams.set("from_date", leaveFromDate);
    } else {
      nextParams.delete("from_date");
    }

    if (leaveToDate) {
      nextParams.set("to_date", leaveToDate);
    } else {
      nextParams.delete("to_date");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    search,
    leaveFromDate,
    leaveToDate,
    searchParams,
    setSearchParams,
  ]);

  // ---------------- Selected personnel ----------------

  const [selectedPerson, setSelectedPerson] = useState(null);

  const [showPersonnelForm, setShowPersonnelForm] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({});
  const [personnelFormError, setPersonnelFormError] = useState("");

  // ---------------- Leave form ----------------

  const [form, setForm] = useState(emptyLeaveForm);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);

  // ---------------- Leave history ----------------

  const [leaveRecords, setLeaveRecords] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // ---------------- RTK Query hooks ----------------

  const [triggerPersonnel] = useLazyGetAllPersonnelQuery();
  const [triggerPerson] = useLazyGetPersonnelByIdQuery();
  const [triggerLeaves] = useLazyGetAllLeavesQuery();

  const [updatePersonnel, { isLoading: isSavingPersonnel }] =
    useUpdatePersonnelMutation();

  const [addLeave, { isLoading: isAddingLeave }] =
    useAddLeaveMutation();

  const [updateLeave, { isLoading: isUpdatingLeave }] =
    useUpdateLeaveMutation();

  const [deleteLeave, { isLoading: isDeletingLeave }] =
    useDeleteLeaveMutation();

  // --------------------------------------------------
  // Personnel pagination and filters
  // --------------------------------------------------

  const loadPersonnelPage = useCallback(
    async ({ reset = false } = {}) => {
      if (!reset && (loadingRef.current || !hasMoreRef.current)) {
        return;
      }

      // Invalidate any previous request.
      const requestId = ++requestIdRef.current;

      // Both dates are required when using the date filter.
      const hasFromDate = Boolean(leaveFromDate);
      const hasToDate = Boolean(leaveToDate);

      if (hasFromDate !== hasToDate) {
        cursorRef.current = null;
        hasMoreRef.current = false;
        loadingRef.current = false;

        setPersonnel([]);
        setPersonnelHasMore(false);
        setPersonnelTotal(0);
        setPersonnelLoadingMore(false);
        setPersonnelLoadError(
          "Please select both Leave From Date and Leave To Date."
        );

        return;
      }

      loadingRef.current = true;
      setPersonnelLoadingMore(true);
      setPersonnelLoadError("");

      if (reset) {
        cursorRef.current = null;
        hasMoreRef.current = true;
      }

      try {
        const params = {
          limit: PAGE_SIZE,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        // Apply leave date range only when both dates are selected.
        if (leaveFromDate && leaveToDate) {
          params.from_date = leaveFromDate;
          params.to_date = leaveToDate;
        }

        if (cursorRef.current) {
          params.cursor = cursorRef.current;
        }

        const response = await triggerPersonnel(params, false).unwrap();

        // Ignore outdated responses.
        if (requestId !== requestIdRef.current) return;

        const rows = getRows(response);

        setPersonnel((previous) => {
          if (reset) {
            return rows;
          }

          const seen = new Set(
            previous.map((item) => item.personnel_id)
          );

          return [
            ...previous,
            ...rows.filter(
              (item) => !seen.has(item.personnel_id)
            ),
          ];
        });

        const next = getNextCursor(response);

        cursorRef.current = next;
        hasMoreRef.current = Boolean(next);

        setPersonnelHasMore(Boolean(next));

        const total =
          response?.pagination?.total ??
          response?.data?.pagination?.total;

        if (total != null) {
          setPersonnelTotal(Number(total));
        }
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Failed to load personnel:", error);

        setPersonnelLoadError(
          error?.data?.message ||
          "Unable to load personnel records."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setPersonnelLoadingMore(false);
        }
      }
    },
    [
      search,
      leaveFromDate,
      leaveToDate,
      triggerPersonnel,
    ]
  );

  // Reload from the first page whenever filters change.
  useEffect(() => {
    setPersonnel([]);
    setPersonnelHasMore(true);
    setPersonnelTotal(null);
    setPersonnelLoadError("");

    cursorRef.current = null;
    hasMoreRef.current = true;

    loadPersonnelPage({ reset: true });
  }, [loadPersonnelPage]);

  // --------------------------------------------------
  // Clear filters
  // --------------------------------------------------

  const clearFilters = () => {
    setSearch("");
    setLeaveFromDate("");
    setLeaveToDate("");
  };

  // --------------------------------------------------
  // Leave history
  // --------------------------------------------------

  const loadPersonLeaves = async (personnelId) => {
    setLeaveLoading(true);
    setLeaveError("");

    try {
      const response = await triggerLeaves(
        {
          personnel_id: personnelId,
          limit: 100,
        },
        false
      ).unwrap();

      setLeaveRecords(getRows(response));
    } catch (error) {
      console.error("Failed to load leave history:", error);

      setLeaveError(
        error?.data?.message ||
        "Unable to load leave history."
      );

      setLeaveRecords([]);
    } finally {
      setLeaveLoading(false);
    }
  };

  // --------------------------------------------------
  // Open personnel management panel
  // --------------------------------------------------

  const openManageLeave = async (person) => {
    setSelectedPerson(person);

    setShowForm(false);
    setShowPersonnelForm(false);
    setEditingLeaveId(null);

    setForm(emptyLeaveForm);
    setFormError("");
    setLeaveRecords([]);
    setLeaveError("");

    try {
      const [personResponse] = await Promise.all([
        triggerPerson(person.personnel_id, false).unwrap(),
        loadPersonLeaves(person.personnel_id),
      ]);

      const fullPerson = getRecord(personResponse);

      if (fullPerson?.personnel_id) {
        setSelectedPerson(fullPerson);
      }
    } catch (error) {
      console.error("Unable to load personnel details:", error);
    }
  };

  // --------------------------------------------------
  // Personnel edit
  // --------------------------------------------------

  const openPersonnelEditForm = () => {
    const prepared = { ...selectedPerson };

    if (prepared.date_of_birth) {
      prepared.date_of_birth = String(
        prepared.date_of_birth
      ).slice(0, 10);
    }

    setPersonnelForm(prepared);
    setPersonnelFormError("");

    setShowForm(false);
    setShowPersonnelForm(true);
  };

  const handlePersonnelChange = (event) => {
    const { name, value } = event.target;

    setPersonnelForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSavePersonnel = async (event) => {
    event.preventDefault();
    setPersonnelFormError("");

    if (!personnelForm.name?.trim()) {
      setPersonnelFormError("Personnel name is required.");
      return;
    }

    const payload = {
      ...personnelForm,
      name: personnelForm.name.trim(),
      serial_no:
        personnelForm.serial_no === "" ||
          personnelForm.serial_no == null
          ? null
          : Number(personnelForm.serial_no),
    };

    try {
      const response = await updatePersonnel({
        personnel_id: selectedPerson.personnel_id,
        ...payload,
      }).unwrap();

      // Fetch the updated record again.
      const refreshedResponse = await triggerPerson(
        selectedPerson.personnel_id,
        false
      ).unwrap();

      const refreshedPerson = getRecord(refreshedResponse);

      const savedPerson = refreshedPerson?.personnel_id
        ? refreshedPerson
        : {
          ...selectedPerson,
          ...payload,
          ...getRecord(response),
        };

      setSelectedPerson(savedPerson);

      setPersonnel((previous) =>
        previous.map((person) =>
          person.personnel_id === selectedPerson.personnel_id
            ? { ...person, ...savedPerson }
            : person
        )
      );

      setPersonnelForm(savedPerson);
      setShowPersonnelForm(false);

      // Refresh dashboard statistics and district summary.
      dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
    } catch (error) {
      setPersonnelFormError(
        error?.data?.message ||
        error?.data?.error ||
        "Unable to update personnel."
      );
    }
  };

  // --------------------------------------------------
  // Leave add / edit / delete
  // --------------------------------------------------

  const openAddForm = () => {
    setShowPersonnelForm(false);
    setEditingLeaveId(null);
    setForm(emptyLeaveForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (leave) => {
    setShowPersonnelForm(false);
    setEditingLeaveId(leave.leave_id);

    setForm({
      from_date: String(leave.from_date || "").slice(0, 10),
      to_date: String(leave.to_date || "").slice(0, 10),
      from_time_period: leave.from_time_period || "AM",
      to_time_period: leave.to_time_period || "PM",
      remarks: leave.remarks || "",
    });

    setFormError("");
    setShowForm(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const handleSaveLeave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.from_date ||
      !form.to_date ||
      !form.remarks.trim()
    ) {
      setFormError("Please fill in the required fields.");
      return;
    }

    if (form.to_date < form.from_date) {
      setFormError("To Date cannot be earlier than From Date.");
      return;
    }

    // Both times must be provided together.
    if (
      (form.from_time && !form.to_time) ||
      (!form.from_time && form.to_time)
    ) {
      setFormError("Please provide both From Time and To Time.");
      return;
    }

    // Convert 12-hour time to MySQL 24-hour TIME format.
    const fromTime24 = toBackendTime(
      form.from_time,
      form.from_time_period
    );

    const toTime24 = toBackendTime(
      form.to_time,
      form.to_time_period
    );

    // Validate entered times.
    if (form.from_time && !fromTime24) {
      setFormError("Enter a valid From Time (HH:MM).");
      return;
    }

    if (form.to_time && !toTime24) {
      setFormError("Enter a valid To Time (HH:MM).");
      return;
    }

    // Compare times when both dates are the same.
    if (
      fromTime24 &&
      toTime24 &&
      form.from_date === form.to_date &&
      toTime24 <= fromTime24
    ) {
      setFormError("To Time must be later than From Time.");
      return;
    }

    const payload = {
      personnel_id: selectedPerson.personnel_id,
      from_date: form.from_date,
      to_date: form.to_date,
      from_time_period: form.from_time_period,
      to_time_period: form.to_time_period,
      remarks: form.remarks.trim(),
    };

    try {
      if (editingLeaveId) {
        await updateLeave({
          leave_id: editingLeaveId,
          ...payload,
        }).unwrap();
      } else {
        await addLeave(payload).unwrap();
      }

      await loadPersonLeaves(selectedPerson.personnel_id);

      dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));

      setShowForm(false);
      setEditingLeaveId(null);
      setForm(emptyLeaveForm);

      if (leaveFromDate && leaveToDate) {
        setPersonnel([]);
        setPersonnelHasMore(true);
        setPersonnelTotal(null);

        cursorRef.current = null;
        hasMoreRef.current = true;

        loadPersonnelPage({ reset: true });
      }
    } catch (error) {
      setFormError(
        error?.data?.message ||
        error?.data?.error ||
        "Unable to save leave record."
      );
    }
  };


  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------
  const handleDeleteLeave = async () => {
    if (!deleteModal.leaveId) return;

    try {
      await deleteLeave(deleteModal.leaveId).unwrap();

      setLeaveRecords((previous) =>
        previous.filter(
          (leave) => leave.leave_id !== deleteModal.leaveId
        )
      );

      dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));

      // Close modal after successful deletion.
      setDeleteModal({
        open: false,
        leaveId: null,
      });

      // Refresh filtered personnel results.
      if (leaveFromDate && leaveToDate) {
        setPersonnel([]);
        setPersonnelHasMore(true);
        setPersonnelTotal(null);

        cursorRef.current = null;
        hasMoreRef.current = true;

        loadPersonnelPage({ reset: true });
      }
    } catch (error) {
      setLeaveError(
        error?.data?.message ||
        "Unable to delete leave record."
      );
    }
  };
  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(
      `${String(date).slice(0, 10)}T00:00:00`
    );

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  // Prevent background page scrolling while Manage panel is open
  // Prevent background scrolling while Manage panel is open
  useEffect(() => {
    if (!selectedPerson) return;

    const body = document.body;
    const html = document.documentElement;

    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;

    // Prevent background scrolling
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [selectedPerson]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-gray-50 p-3 md:p-4">

      {/* Page heading */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-gray-800">
          Leave Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage personnel leave records and history.
        </p>
      </div>

      {/* Personnel table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">

        {/* Search and filters */}

        <div className="shrink-0 space-y-3 border-b p-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Personnel Records
            </h2>

            <p className="text-xs text-gray-500">
              Select a person to manage their biodata and leave records.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto]">

            {/* Search */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-700">
                Search Personnel
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Leave From Date */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-700">
                Leave From Date
              </label>

              <input
                type="date"
                value={leaveFromDate}
                max={leaveToDate || undefined}
                onChange={(event) => setLeaveFromDate(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Leave To Date */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-700">
                Leave To Date
              </label>

              <input
                type="date"
                value={leaveToDate}
                min={leaveFromDate || undefined}
                onChange={(event) => setLeaveToDate(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Clear */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!search && !leaveFromDate && !leaveToDate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <RotateCcw size={15} />
                Clear
              </button>
            </div>
          </div>

          {(leaveFromDate || leaveToDate) && (
            <p className="text-xs text-gray-500">
              <CalendarDays size={13} className="mr-1 inline" />
              Showing personnel who have leave overlapping the selected date range.
            </p>
          )}

          {personnelLoadError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {personnelLoadError}
            </p>
          )}
        </div>


        {/* Results count */}


        {/* Horizontal scroll area */}
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-[900px] flex-col">

            {/* Table header */}
            <div className="shrink-0 border-b bg-gray-50">
              <div className="grid grid-cols-[70px_1.5fr_1fr_1fr_1.3fr_120px] px-4 py-2 text-xs font-semibold uppercase text-gray-700">
                <div>Sl. No.</div>
                <div>Name</div>

                <div>WBP ID</div>
                <div>District</div>
                <div>Recruited Unit</div>
                <div className="text-center">Action</div>
              </div>
            </div>

            {/* Virtual personnel list */}
            <div className="min-h-0 flex-1 overflow-hidden">
              <VirtualList
                items={personnel}
                estimateSize={48}
                overscan={8}
                getItemKey={(person, index) =>
                  person.personnel_id ?? index
                }
                emptyMessage={
                  personnelLoadingMore
                    ? "Loading personnel..."
                    : "No personnel records found."
                }
                hasMore={
                  personnelHasMore && !personnelLoadError
                }
                isLoadingMore={personnelLoadingMore}
                onEndReached={loadPersonnelPage}
                endThreshold={10}
                loadingText="Loading more personnel..."
                renderItem={(person) => (
                  <div
                    className="grid h-[48px] grid-cols-[70px_1.5fr_1fr_1fr_1.3fr_120px] items-center border-b px-4 transition-colors hover:bg-gray-50"
                    key={person.personnel_id}
                  >
                    <div className="text-sm text-gray-600">
                      {person.serial_no ?? "-"}
                    </div>
                    <div
                      className="min-w-0"
                      title={person.name || "-"}
                    >
                      <p className="truncate text-sm font-medium text-gray-800">
                        {person.name || "-"}
                      </p>

                      <p
                        className="truncate text-[11px] text-gray-400"
                        title={`PTS: ${person.pts_chest_no || "-"}`}
                      >
                        PTS: {person.pts_chest_no || "-"}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600" title={person.wbp_id || "-"}>
                      {person.wbp_id || "-"}
                    </div>

                    <div
                      className="truncate pr-2 text-sm text-gray-600"
                      title={person.home_district || "-"}
                    >
                      {person.home_district || "-"}
                    </div>

                    <div
                      className="truncate pr-2 text-sm text-gray-600"
                      title={person.recruited_unit || "-"}
                    >
                      {person.recruited_unit || "-"}
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => openManageLeave(person)}
                        className="inline-flex items-center gap-1 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Manage
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* List footer */}
        <div className="shrink-0 border-t bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
          {personnelLoadingMore
            ? "Loading more personnel..."
            : personnel.length > 0 && !personnelHasMore
              ? "All matching personnel loaded."
              : ""}

          {personnelLoadError && (
            <button
              type="button"
              onClick={() => {
                setPersonnelLoadError("");
                loadPersonnelPage({ reset: !personnel.length });
              }}
              className="ml-2 text-red-600 underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------
          Personnel side panel
      ------------------------------------------------ */}

      {selectedPerson && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedPerson(null)}
          />

          {/* Panel */}
          <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">

            {/* Panel heading */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Manage Personnel
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Personnel biodata and leave management
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="rounded-lg cursor-pointer p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Panel content */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">

              {/* Personnel summary */}
              {!showPersonnelForm && (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                        {selectedPerson.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-800">
                          {selectedPerson.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {selectedPerson.wbp_id || "No WBP ID"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin
                        size={16}
                        className="mt-0.5 text-gray-400"
                      />

                      <div>
                        <p className="text-xs text-gray-400">
                          Home District
                        </p>

                        <p className="text-sm font-medium text-gray-700">
                          {selectedPerson.home_district || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Building2
                        size={16}
                        className="mt-0.5 text-gray-400"
                      />

                      <div>
                        <p className="text-xs text-gray-400">
                          Recruited Unit
                        </p>

                        <p className="text-sm font-medium text-gray-700">
                          {selectedPerson.recruited_unit || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openPersonnelEditForm}
                    className="mt-5 inline-flex cursor-pointer w-full items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    <Pencil size={15} />
                    Edit Personnel Details
                  </button>
                </div>
              )}

              {/* Personnel edit form */}
              {showPersonnelForm && (
                <form
                  onSubmit={handleSavePersonnel}
                  className="space-y-5  pb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowPersonnelForm(false)}
                        className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                      >
                        <ArrowLeft size={14} />
                        Back to personnel
                      </button>

                      <h3 className="text-lg font-semibold text-gray-800">
                        Edit Personnel Details
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Update all biodata information.
                      </p>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <UserRound size={20} />
                    </div>
                  </div>

                  {personnelSections.map((section, index) => (
                    <div
                      key={section.title}
                      className="space-y-4 rounded-xl border p-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          {index + 1}. {section.title}
                        </h4>

                        <p className="mt-1 text-xs text-gray-400">
                          {section.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {section.fields.map((field) => (
                          <FormField
                            key={field.name}
                            field={field}
                            value={personnelForm[field.name]}
                            onChange={handlePersonnelChange}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {personnelFormError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {personnelFormError}
                    </p>
                  )}

                  <div className="flex justify-end gap-3 border-t bg-white py-4">
                    <button
                      type="button"
                      onClick={() => setShowPersonnelForm(false)}
                      className="rounded-lg border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSavingPersonnel}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      <Save size={16} />
                      {isSavingPersonnel ? "Saving..." : "Save Personnel"}
                    </button>
                  </div>
                </form>
              )}

              {/* Add leave button */}
              {!showForm && !showPersonnelForm && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-500 py-3 font-medium text-white transition hover:bg-red-600"
                >
                  <Plus size={18} />
                  Add Leave Record
                </button>
              )}

              {/* Leave form */}
              {showForm && (
                <form
                  onSubmit={handleSaveLeave}
                  className="space-y-4 rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {editingLeaveId
                          ? "Edit Leave Record"
                          : "New Leave Record"}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Enter leave date and details.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingLeaveId(null);
                      }}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        From Date *
                      </label>

                      <input
                        type="date"
                        name="from_date"
                        inputMode="numeric"
                        autoComplete="off"
                        value={form.from_date}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        To Date *
                      </label>

                      <input
                        type="date"
                        name="to_date"
                        value={form.to_date}
                        min={form.from_date || undefined}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        From Time
                      </label>

                      <div className="flex gap-2">

                        {/* <input
  type="text"
  name="from_time"
  value={form.from_time}
  onChange={handleFormChange}
    onBlur={handleTimeBlur}
  placeholder="HH:MM"
  maxLength={5}
  inputMode="numeric"
  autoComplete="off"
  className="min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100"
/> */}
                        <select
                          name="from_time_period"
                          value={form.from_time_period}
                          onChange={handleFormChange}
                          // disabled={!form.from_time}
                          className="w-24 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        To Time
                      </label>

                      <div className="flex gap-2">
                        {/*                        
                                             <input
  type="text"
  name="to_time"
  value={form.to_time}
  onChange={handleFormChange}
    onBlur={handleTimeBlur}
  placeholder="HH:MM"
  maxLength={5}
  inputMode="numeric"
  autoComplete="off"
  className="min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100"
/> */}
                        <select
                          name="to_time_period"
                          value={form.to_time_period}
                          onChange={handleFormChange}
                          // disabled={!form.to_time}
                          className="w-24 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Remarks *
                    </label>

                    <input
                      type="text"
                      name="remarks"
                      value={form.remarks}
                      onChange={handleFormChange}
                      placeholder="Example: CL, EOL, ML"
                      required
                      maxLength={255}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {formError}
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingLeaveId(null);
                      }}
                      className="rounded-lg border px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isAddingLeave || isUpdatingLeave}
                      className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      {isAddingLeave || isUpdatingLeave
                        ? "Saving..."
                        : editingLeaveId
                          ? "Update Leave"
                          : "Save Leave"}
                    </button>
                  </div>
                </form>
              )}

              {/* Leave history */}
              {!showPersonnelForm && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Leave History
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {leaveRecords.length} leave records
                      </p>
                    </div>

                    <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                      <CalendarDays size={20} />
                    </div>
                  </div>

                  {leaveLoading ? (
                    <div className="rounded-xl border py-10 text-center text-sm text-gray-500">
                      Loading leave history...
                    </div>
                  ) : leaveError ? (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                      {leaveError}
                    </div>
                  ) : leaveRecords.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-10 text-center">
                      <FileText
                        size={30}
                        className="mx-auto mb-2 text-gray-300"
                      />

                      <p className="text-xs text-gray-500">
                        No leave records found.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...leaveRecords]
                        .sort((a, b) =>
                          String(b.from_date).localeCompare(
                            String(a.from_date)
                          )
                        )
                        .map((leave) => (
                          <div
                            key={leave.leave_id}
                            className="rounded-xl border p-4 transition hover:border-gray-300"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <CalendarDays
                                    size={15}
                                    className="text-gray-400"
                                  />

                                  <span>
                                    {formatDate(leave.from_date)}

                                    {String(leave.from_date).slice(0, 10) !==
                                      String(leave.to_date).slice(0, 10)
                                      ? ` - ${formatDate(leave.to_date)}`
                                      : ""}
                                  </span>
                                </div>

                                {(leave.from_time || leave.to_time) && (
                                  // <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                  //   <Clock size={14} />

                                  //   <span>
                                  //     {formatTime12Hour(leave.from_time) || "-"} to{" "}
                                  //     {formatTime12Hour(leave.to_time) || "-"}
                                  //   </span>
                                  // </div>
                                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={14} />
                                    <span>
                                      {leave.from_time_period || "-"} to {leave.to_time_period || "-"}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditForm(leave)}
                                  className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-xs text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteModal({
                                      open: true,
                                      leaveId: leave.leave_id,
                                    })
                                  }
                                  className="cursor-pointer rounded-lg px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 border-t pt-3">
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                Remarks
                              </p>

                              <p
                                className="break-words text-sm leading-5 text-gray-700"
                                title={leave.remarks || ""}
                              >
                                {String(leave.remarks || "").length > 140
                                  ? `${String(leave.remarks).slice(0, 140)}...`
                                  : leave.remarks || "-"}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <DeleteAlertModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({
            open: false,
            leaveId: null,
          })
        }
        onConfirm={handleDeleteLeave}
        isDeleting={isDeletingLeave}
        itemName="this leave record"
      />
    </div>

  );
}
