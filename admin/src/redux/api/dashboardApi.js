import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000/api/",
        credentials: "include",
    }),
    tagTypes: ["Dashboard"],
    endpoints: (builder) => ({
        getPersonnelDashboard: builder.query({
            query: () => "admin/dashboard",
            providesTags: ["Dashboard"],
        }),
    }),
});

export const {
    useGetPersonnelDashboardQuery,
} = dashboardApi;