// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig(({ mode }) => ({
//   plugins: [react(), tailwindcss()],
//   esbuild: mode === "production" ? {
//     drop: ["console", "debugger"], // removes ALL console.* and debugger
//   } : {},
// }))
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"   // ✅ ADD THIS

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // ✅ THIS FIXES YOUR ERROR
    },
  },

  esbuild: mode === "production" ? {
    drop: ["console", "debugger"],
  } : {},
}))
