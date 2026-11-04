import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const uploadApi = createApi({
  reducerPath: "uploadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include", // same as withCredentials: true
  }),
  tagTypes: ["Personnel"],
  endpoints: (builder) => ({
    // POST  /api/admin/upload/personnel-excel
    // Multer on the backend reads the field named "file": excelUpload.single("file")
    uploadPersonnelExcel: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `admin/upload/personnel-excel`, // 👈 change if your router is mounted on a different path
          method: "POST",
          body: formData, // do NOT set Content-Type; the browser adds the multipart boundary
        };
      },
      invalidatesTags: ["Personnel"],
    }),
  }),
});

export const { useUploadPersonnelExcelMutation } = uploadApi;