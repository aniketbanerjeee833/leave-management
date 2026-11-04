import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  UserRound,
  FileText,
  AlertCircle,
} from "lucide-react";

import { useGetPersonnelDashboardQuery } from "@/redux/api/dashboardApi";

// Format MySQL DATE strings without timezone conversion.
const formatDate = (value) => {
  if (!value) return "-";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  if (!year || !month || !day) return "-";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateRange = (fromDate, toDate) => {
  if (!fromDate) return "-";

  const from = formatDate(fromDate);
  const to = formatDate(toDate);

  return String(fromDate).slice(0, 10) === String(toDate).slice(0, 10)
    ? from
    : `${from} – ${to}`;
};

const StatCard = ({ title, value, description, icon: Icon, iconClass }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-700">
          {Number(value || 0).toLocaleString("en-IN")}
        </p>
        <p className="mt-1 text-xs text-gray-700">{description}</p>
      </div>

      <div className={`rounded-xl p-3 ${iconClass}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, description, to, linkText = "View all" }) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
    <div className="min-w-0">
      <h2 className="truncate text-sm font-semibold text-gray-800 sm:text-base">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>

    {to && (
      <Link
        to={to}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
      >
        {linkText}
        <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="px-4 py-10 text-center">
    <FileText size={28} className="mx-auto mb-2 text-gray-300" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default function Dashboard() {
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetPersonnelDashboardQuery();

  const dashboard = response?.data || {};
  const statistics = dashboard.statistics || {};
  const todayLeaves = dashboard.todayLeaves || [];

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <RefreshCw size={17} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <AlertCircle size={30} className="mx-auto mb-3 text-red-500" />
          <h2 className="font-semibold text-gray-800">
            Unable to load
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {error?.data?.message || "Please check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  const formatTime12Hour = (time) => {
    if (!time) return "-";

    const [hours, minutes] = String(time).slice(0, 5).split(":");

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-5 overflow-hidden">
        {/* Page heading */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of personnel records and leave activity.
            </p>
          </div>

          <button
            type="button"
            onClick={refetch}
            disabled={isFetching}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <section className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total Personnel"
            value={statistics.totalPersonnel}
            description="Total  records"
            icon={Users}
            iconClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="On Leave Today"
            value={statistics.onLeaveToday}
            description="Distinct personnel currently on leave"
            icon={CalendarCheck}
            iconClass="bg-orange-50 text-orange-600"
          />
          <StatCard
            title="This Month"
            value={statistics.monthlyLeaveRecords}
            description="Leave records starting this month"
            icon={CalendarDays}
            iconClass="bg-green-50 text-green-600"
          />
        </section>

        {/* Main dashboard panels */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Today's leaves */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Today's Leaves"
              description="Personnel currently on leave today"
              to="/leave"
            />

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="sticky top-0 z-10 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold sm:px-5">Name</th>
                    <th className="px-4 py-3 font-semibold">WBP ID</th>
                    {/* <th className="px-4 py-3 font-semibold">District</th> */}
                    <th className="px-4 py-3 font-semibold">Leave Period</th>
                    <th className="px-4 py-3 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState message="No personnel are on leave today." />
                      </td>
                    </tr>
                  ) : (
                    todayLeaves.map((leave) => (
                      <tr key={leave.leave_id} className="transition hover:bg-gray-50">

                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                              <UserRound size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-800"  title={leave.name || "-"}>
                                {leave.name || "-"}
                              </p>

                              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-400">
                                <span className="truncate" title={leave.pts_chest_no || "-"}>
                                  PTS: {leave.pts_chest_no || "-"}
                                </span>

                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600" title={leave.wbp_id || "-"}>
                          {leave.wbp_id || "-"}
                        </td>
                        {/* <td className="px-4 py-3 text-sm text-gray-600">
                          {leave.home_district || "-"}
                        </td> */}
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                          {formatDateRange(leave.from_date, leave.to_date)}
                          {(leave.from_time || leave.to_time) && (
                            <p className="mt-1 text-[11px] text-gray-400">
                              {formatTime12Hour(leave.from_time)} to{" "}
                              {formatTime12Hour(leave.to_time)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block max-w-[350px] whitespace-normal break-words rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-medium leading-5 text-orange-700"
                            title={leave.remarks || "-"}
                          >
                            {leave.remarks
                              ? leave.remarks.length > 100
                                ? `${leave.remarks.slice(0, 100)}...`
                                : leave.remarks
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>




      </div>
    </div>
  );
}
