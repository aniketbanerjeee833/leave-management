
import { useCallback, useEffect, useRef, useState } from "react";
import VirtualList from "../components/common/VirtualList";
import {
    Search,
    X,
    ChevronRight,
    UserRound,
    MapPin,
    Building2,
    GraduationCap,
    FileText,
    Phone,
    CalendarDays,
    IdCard,
    RotateCcw,
} from "lucide-react";

import {
    useLazyGetAllPersonnelQuery,

} from "@/redux/api/personnelApi";

const PAGE_SIZE = 30;

// --------------------------------------------------
// API response helpers
// --------------------------------------------------

const getRows = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.personnel)) return response.personnel;
    if (Array.isArray(response?.results)) return response.results;

    return [];
};

// const getRecord = (response) =>
//   response?.data?.personnel ||
//   response?.data ||
//   response?.personnel ||
//   response;

const getNextCursor = (response) =>
    response?.pagination?.nextCursor ??
    response?.pagination?.next_cursor ??
    response?.nextCursor ??
    response?.next_cursor ??
    response?.data?.pagination?.nextCursor ??
    response?.data?.pagination?.next_cursor ??
    null;

// --------------------------------------------------
// Formatting helpers
// --------------------------------------------------

// const formatDate = (date) => {
//   if (!date) return "-";

//   const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);

//   if (Number.isNaN(parsed.getTime())) return "-";

//   return parsed.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const DetailItem = ({ label, value, icon: Icon }) => (
//   <div className="min-w-0">
//     <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
//       {Icon && <Icon size={13} />}
//       {label}
//     </p>

//     <p className="break-words text-sm font-medium text-gray-700">
//       {value !== null && value !== undefined && String(value).trim()
//         ? value
//         : "-"}
//     </p>
//   </div>
// );

// const DetailSection = ({ title, description, children }) => (
//   <div className="space-y-4 rounded-xl border bg-white p-4">
//     <div>
//       <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
//       {description && (
//         <p className="mt-1 text-xs text-gray-400">{description}</p>
//       )}
//     </div>

//     <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
//       {children}
//     </div>
//   </div>
// );

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function Database() {
    const [personnel, setPersonnel] = useState([]);
    const [search, setSearch] = useState("");

    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [total, setTotal] = useState(null);
    const [loadError, setLoadError] = useState("");

    //   const [selectedPerson, setSelectedPerson] = useState(null);
    //   const [detailsLoading, setDetailsLoading] = useState(false);
    //   const [detailsError, setDetailsError] = useState("");

    const cursorRef = useRef(null);
    const hasMoreRef = useRef(true);
    const loadingRef = useRef(false);
    const requestIdRef = useRef(0);

    const [triggerPersonnel] = useLazyGetAllPersonnelQuery();
    //   const [triggerPerson] = useLazyGetPersonnelByIdQuery();

    // --------------------------------------------------
    // Load personnel with cursor pagination
    // --------------------------------------------------

    const loadPersonnelPage = useCallback(
        async ({ reset = false } = {}) => {
            if (!reset && (loadingRef.current || !hasMoreRef.current)) {
                return;
            }

            const requestId = ++requestIdRef.current;

            loadingRef.current = true;
            setLoadingMore(true);
            setLoadError("");

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

                if (cursorRef.current) {
                    params.cursor = cursorRef.current;
                }

                const response = await triggerPersonnel(params, false).unwrap();

                if (requestId !== requestIdRef.current) return;

                const rows = getRows(response);

                setPersonnel((previous) => {
                    if (reset) return rows;

                    const seen = new Set(
                        previous.map((person) => person.personnel_id)
                    );

                    return [
                        ...previous,
                        ...rows.filter(
                            (person) => !seen.has(person.personnel_id)
                        ),
                    ];
                });

                const nextCursor = getNextCursor(response);

                cursorRef.current = nextCursor;
                hasMoreRef.current = Boolean(nextCursor);
                setHasMore(Boolean(nextCursor));

                const responseTotal =
                    response?.pagination?.total ??
                    response?.data?.pagination?.total;

                if (responseTotal != null) {
                    setTotal(Number(responseTotal));
                }
            } catch (error) {
                if (requestId !== requestIdRef.current) return;

                console.error("Failed to load personnel:", error);

                setLoadError(
                    error?.data?.message || "Unable to load personnel records."
                );
            } finally {
                if (requestId === requestIdRef.current) {
                    loadingRef.current = false;
                    setLoadingMore(false);
                }
            }
        },
        [search, triggerPersonnel]
    );

    // Reload when search changes
    useEffect(() => {
        setPersonnel([]);
        setTotal(null);
        setHasMore(true);
        setLoadError("");

        cursorRef.current = null;
        hasMoreRef.current = true;

        loadPersonnelPage({ reset: true });
    }, [loadPersonnelPage]);

    // --------------------------------------------------
    // Search clear
    // --------------------------------------------------

    const clearSearch = () => {
        setSearch("");
    };

    // --------------------------------------------------
    // View personnel details
    // --------------------------------------------------

    //   const handleViewPersonnel = async (person) => {
    //     setSelectedPerson(person);
    //     setDetailsLoading(true);
    //     setDetailsError("");

    //     try {
    //       const response = await triggerPerson(
    //         person.personnel_id,
    //         false
    //       ).unwrap();

    //       const fullPerson = getRecord(response);

    //       if (fullPerson?.personnel_id) {
    //         setSelectedPerson(fullPerson);
    //       }
    //     } catch (error) {
    //       console.error("Unable to load personnel details:", error);

    //       setDetailsError(
    //         error?.data?.message ||
    //         "Unable to load complete personnel details."
    //       );
    //     } finally {
    //       setDetailsLoading(false);
    //     }
    //   };

    //   const closeDetails = () => {
    //     setSelectedPerson(null);
    //     setDetailsError("");
    //   };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-gray-50 p-3 md:p-4">

            {/* Page heading */}
            <div className="shrink-0">
                <h1 className="text-xl font-bold text-gray-800">
                    Database
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View and search personnel biodata records.
                </p>
            </div>

            {/* Personnel table */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white shadow-sm">

                {/* Search */}
                <div className="shrink-0 space-y-3 border-b p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800">
                                Personnel Records
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                View complete personnel information.
                            </p>
                        </div>

                        {total !== null && (
                            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                                {total} Records
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1 w-1/3">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search"
                                className=" rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={clearSearch}
                            disabled={!search}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={15} />
                            Clear
                        </button>
                    </div>

                    {loadError && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                            <span>{loadError}</span>

                            <button
                                type="button"
                                onClick={() => loadPersonnelPage({ reset: true })}
                                className="cursor-pointer underline"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                {/* Personnel list */}
                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex h-full min-w-[850px] flex-col">

                        {/* Table header */}
                        <div className="shrink-0 border-b bg-gray-50">
                            <div className="grid grid-cols-[70px_1.5fr_1fr_1fr_1.3fr_110px] px-4 py-3 text-xs font-semibold uppercase text-gray-700">
                                <div>Sl. No.</div>
                                <div>Name</div>
                                <div>Phone Number</div>
                                <div>WBP ID</div>
                                <div>District</div>
                                <div>Recruited Unit</div>
                                {/* <div className="text-center">Action</div> */}
                            </div>
                        </div>

                        {/* Virtual list */}
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <VirtualList
                                items={personnel}
                                estimateSize={48}
                                overscan={8}
                                getItemKey={(person, index) =>
                                    person.personnel_id ?? index
                                }
                                emptyMessage={
                                    loadingMore
                                        ? "Loading personnel..."
                                        : "No personnel records found."
                                }
                                hasMore={hasMore && !loadError}
                                isLoadingMore={loadingMore}
                                onEndReached={loadPersonnelPage}
                                endThreshold={10}
                                loadingText="Loading more personnel..."
                                renderItem={(person) => (
                                    <div
                                        key={person.personnel_id}
                                        className="grid h-[48px] grid-cols-[70px_1.5fr_1fr_1fr_1.3fr_110px] items-center border-b px-4 transition-colors hover:bg-gray-50"
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

                                        <div className="text-sm text-gray-600" title={person.mobile_no || "-"}>
                                            {person.mobile_no || "-"}
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

                                        {/* <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleViewPersonnel(person)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        View
                        <ChevronRight size={14} />
                      </button>
                    </div> */}
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
                    {loadingMore
                        ? "Loading personnel..."
                        : personnel.length > 0 && !hasMore
                            ? "All matching personnel loaded."
                            : ""}
                </div>
            </div>

            {/* ------------------------------------------------
          Personnel details side panel
      ------------------------------------------------ */}

            {/* {selectedPerson && (
        <div className="fixed inset-0 z-50 flex justify-end">

         
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetails}
          />

       
          <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">

         
            <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Personnel Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Complete biodata information
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-gray-50 p-4 sm:p-5">

              {detailsLoading ? (
                <div className="flex min-h-60 items-center justify-center">
                  <p className="text-sm text-gray-500">
                    Loading personnel details...
                  </p>
                </div>
              ) : detailsError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {detailsError}
                </div>
              ) : (
                <>
                  
                  <div className="rounded-xl border bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                        {selectedPerson.name?.charAt(0)?.toUpperCase() || (
                          <UserRound size={22} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-800">
                          {selectedPerson.name || "-"}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          WBP ID: {selectedPerson.wbp_id || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <DetailItem
                        label="Serial Number"
                        value={selectedPerson.serial_no}
                        icon={IdCard}
                      />

                      <DetailItem
                        label="PTS Chest No."
                        value={selectedPerson.pts_chest_no}
                        icon={IdCard}
                      />
                    </div>
                  </div>

                 
                  <DetailSection
                    title="Basic Information"
                    description="Personnel identification and personal details."
                  >
                    <DetailItem
                      label="SVSPA RC/LRC No."
                      value={selectedPerson.svspa_rc_lrc_no}
                    />

                    <DetailItem
                      label="Father's Name"
                      value={selectedPerson.father_name}
                    />

                    <DetailItem
                      label="Date of Birth"
                      value={formatDate(selectedPerson.date_of_birth)}
                      icon={CalendarDays}
                    />

                    <DetailItem
                      label="Marital Status"
                      value={selectedPerson.marital_status}
                    />
                  </DetailSection>

                
                  <DetailSection
                    title="Address Information"
                    description="Permanent address and contact details."
                  >
                    <DetailItem
                      label="Village / City"
                      value={selectedPerson.village_city}
                      icon={MapPin}
                    />

                    <DetailItem
                      label="Post Office"
                      value={selectedPerson.post_office}
                    />

                    <DetailItem
                      label="Police Station"
                      value={selectedPerson.police_station}
                    />

                    <DetailItem
                      label="PIN Code"
                      value={selectedPerson.pin_code}
                    />

                    <DetailItem
                      label="Home District"
                      value={selectedPerson.home_district}
                    />

                    <DetailItem
                      label="Home Police Station"
                      value={selectedPerson.home_police_station}
                    />

                    <DetailItem
                      label="Mobile Number"
                      value={selectedPerson.mobile_no}
                      icon={Phone}
                    />
                  </DetailSection>

                
                  <DetailSection
                    title="Recruitment Information"
                    description="Recruitment and salary drawing details."
                  >
                    <DetailItem
                      label="Recruited District / Unit"
                      value={selectedPerson.recruited_unit}
                      icon={Building2}
                    />

                    <DetailItem
                      label="Salary Drawing District / Unit"
                      value={selectedPerson.salary_drawing_unit}
                    />
                  </DetailSection>

                
                  <DetailSection
                    title="Education & Other Information"
                    description="Educational qualifications and personal details."
                  >
                    <DetailItem
                      label="Education"
                      value={selectedPerson.education}
                      icon={GraduationCap}
                    />

                    <DetailItem
                      label="Religion"
                      value={selectedPerson.religion}
                    />

                    <DetailItem
                      label="Caste"
                      value={selectedPerson.caste}
                    />

                    <DetailItem
                      label="Exempted Category"
                      value={selectedPerson.exempted_category}
                    />

                    <DetailItem
                      label="Driving Licence"
                      value={selectedPerson.driving_licence}
                    />

                    <DetailItem
                      label="Driving Licence Details"
                      value={selectedPerson.driving_licence_details}
                    />

                    <div className="sm:col-span-2">
                      <DetailItem
                        label="Computer Knowledge"
                        value={selectedPerson.computer_knowledge}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <DetailItem
                        label="Extracurricular Activities"
                        value={selectedPerson.extracurricular_activities}
                      />
                    </div>
                  </DetailSection>

                
                  <DetailSection
                    title="Additional Information"
                    description="Other information available in the personnel database."
                  >
                    <div className="sm:col-span-2">
                      <DetailItem
                        label="Remarks"
                        value={selectedPerson.remarks}
                        icon={FileText}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <DetailItem
                        label="Legacy Leave Details"
                        value={selectedPerson.legacy_leave_details}
                      />
                    </div>
                  </DetailSection>
                </>
              )}
            </div>

          
            <div className="shrink-0 border-t bg-white px-5 py-3">
              <button
                type="button"
                onClick={closeDetails}
                className="w-full cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}
        </div>
    );
}
