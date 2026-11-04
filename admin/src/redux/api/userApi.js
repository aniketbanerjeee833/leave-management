import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";





export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include", // same as withCredentials: true
  }),
  tagTypes: ["User"], // 👈 added Location for countries/states/cities
  endpoints: (builder) => ({

    

    

    adminLogin: builder.mutation({
      query: (body) => ({
        url: `admin/login`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    adminLogout: builder.mutation({
      query: () => ({
        url: `admin/logout`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getAllContactUs: builder.query({
      query: ({ page = 1, limit = 5, search = "" }) =>
        `admin/contact-us/all?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ["User"],
    }),


  
  

    
  }),
});


export const {

 
  useAdminLoginMutation,
  useAdminLogoutMutation,
  useGetAllContactUsQuery
} = userApi;
