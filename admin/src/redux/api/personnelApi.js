import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const personnelApi = createApi({
    reducerPath: "personnelApi",

    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000/api/",
        credentials: "include",
    }),

    tagTypes: ["Personnel", "Leave"],

    endpoints: (builder) => ({

        // =========================
        // PERSONNEL APIs
        // =========================

        // Get all personnel with cursor pagination and filters
        getAllPersonnel: builder.query({
            query: (params = {}) => ({
                url: "admin/personnel",
                method: "GET",
                params,
            }),

            providesTags: (result) => [
                { type: "Personnel", id: "LIST" },
                ...getArrayFromResponse(result, [
                    "data",
                    "personnel",
                    "results",
                ]).map((person) => ({
                    type: "Personnel",
                    id: person.personnel_id,
                })),
            ],
        }),

        // Get single personnel by ID
        getPersonnelById: builder.query({
            query: (personnel_id) => ({
                url: `admin/personnel/${personnel_id}`,
                method: "GET",
            }),

            providesTags: (result, error, personnel_id) => [
                { type: "Personnel", id: personnel_id },
            ],
        }),

        // Update personnel
        updatePersonnel: builder.mutation({
            query: ({ personnel_id, ...body }) => ({
                url: `admin/personnel/${personnel_id}`,
                method: "PUT",
                body,
            }),

            invalidatesTags: (result, error, { personnel_id }) => [
                { type: "Personnel", id: personnel_id },
                { type: "Personnel", id: "LIST" },
                { type: "Leave", id: "LIST" },
            ],
        }),

        // =========================
        // LEAVE APIs
        // =========================

        // Get all leaves with cursor pagination and filters
        getAllLeaves: builder.query({
            query: (params = {}) => ({
                url: "admin/personnel/leaves",
                method: "GET",
                params,
            }),

            providesTags: (result) => [
                { type: "Leave", id: "LIST" },
                ...getArrayFromResponse(result, [
                    "data",
                    "leaves",
                    "results",
                ]).map((leave) => ({
                    type: "Leave",
                    id: leave.leave_id,
                })),
            ],
        }),

        // Get single leave by ID
        getLeaveById: builder.query({
            query: (leave_id) => ({
                url: `admin/personnel/leaves/${leave_id}`,
                method: "GET",
            }),

            providesTags: (result, error, leave_id) => [
                { type: "Leave", id: leave_id },
            ],
        }),

        // Add leave
        addLeave: builder.mutation({
            query: (body) => ({
                url: "admin/personnel/leaves",
                method: "POST",
                body,
            }),

            invalidatesTags: [
                { type: "Leave", id: "LIST" },
            ],
        }),

        // Update leave
        updateLeave: builder.mutation({
            query: ({ leave_id, ...body }) => ({
                url: `admin/personnel/leaves/${leave_id}`,
                method: "PUT",
                body,
            }),

            invalidatesTags: (result, error, { leave_id }) => [
                { type: "Leave", id: leave_id },
                { type: "Leave", id: "LIST" },
            ],
        }),

        // Delete leave
        deleteLeave: builder.mutation({
            query: (leave_id) => ({
                url: `admin/personnel/leaves/${leave_id}`,
                method: "DELETE",
            }),

            invalidatesTags: (result, error, leave_id) => [
                { type: "Leave", id: leave_id },
                { type: "Leave", id: "LIST" },
            ],
        }),
    }),
});

// Safely extract arrays from different possible API response formats
function getArrayFromResponse(result, possibleKeys = []) {
    if (!result) return [];

    if (Array.isArray(result)) {
        return result;
    }

    for (const key of possibleKeys) {
        if (Array.isArray(result[key])) {
            return result[key];
        }
    }

    if (result.data && typeof result.data === "object") {
        for (const key of possibleKeys) {
            if (Array.isArray(result.data[key])) {
                return result.data[key];
            }
        }
    }

    return [];
}

// =========================
// GENERATED HOOKS
// =========================

export const {
    // Personnel
    useGetAllPersonnelQuery,
    useLazyGetAllPersonnelQuery,
    useGetPersonnelByIdQuery,
    useLazyGetPersonnelByIdQuery,
    useUpdatePersonnelMutation,

    // Leaves
    useGetAllLeavesQuery,
    useLazyGetAllLeavesQuery,
    useGetLeaveByIdQuery,
    useLazyGetLeaveByIdQuery,
    useAddLeaveMutation,
    useUpdateLeaveMutation,
    useDeleteLeaveMutation,

} = personnelApi;