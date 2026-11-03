
// import errorHandler from "./middleware/errorHandler.js";
 import userRoutes from "./routes/userRoutes.js";
 import adminRoutes from "./routes/admin/adminRoutes.js"
 import qrRoutes from "./routes/admin/qrRoutes.js"
  import profileRoutes from "./routes/profileRoutes.js"
  import productRoutes from "./routes/admin/productRoutes.js"
  import shopRoutes from "./routes/shopRoutes.js"
  import shippingAndPurchaseRoutes from "./routes/admin/shippingAndPurchaseRoutes.js"
  import homeRoutes from "./routes/admin/homeRoutes.js"
  import  registeredMembersRoutes from "./routes/admin/registeredMembersRoutes.js"
 import uploadRoutes from "./routes/admin/uploadRoutes.js"
import personnelRoutes from "./routes/admin/personnelRoutes.js"


import express from "express";

import cors from "cors";
// import helmet from "helmet";  
import cookieParser from "cookie-parser";

// import { clearExpiredLoginAttempts, clearExpiredSessions } from "./utils/cronJobs.js";
import path from "path";
// import http from "http";
// import { Server } from "socket.io";   // <-- MUST COME FROM socket.io

 import { fileURLToPath } from "url";
import clearExpiredSessions from "./utils/clearExpiredSessions.js";
//  import clearExpiredQr from "./utils/qrExpiryCron.js";


// import dailyStockCarryForward from "./cron/dailyStockCarryForward.js";







const app = express();
app.use(express.json());

// const isProduction=false

// const server = http.createServer(app);
// export const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173", "http://localhost:3000"],
//     methods: ["GET", "POST", "PATCH"],
//     credentials: true
//   }
// });

// app.use(helmet());
// if (isProduction) {
//   console.log("🚀 Running Helmet in PRODUCTION mode with strict CSP");

//   app.use(
//     helmet({
//       crossOriginResourcePolicy: { policy: "cross-origin" },
//       crossOriginEmbedderPolicy: false,
//       contentSecurityPolicy: {
//         useDefaults: false,
//         directives: {
//           defaultSrc: ["'self'"],
//           scriptSrc: [
//             "'self'",
//             "'unsafe-inline'",
//             "'unsafe-eval'",
//             "https://cdn.jsdelivr.net",
//             "https://cdnjs.cloudflare.com",
//           ],
//           styleSrc: [
//             "'self'",
//             "'unsafe-inline'",
//             "https://fonts.googleapis.com",
//             "https://cdn.jsdelivr.net",
//             "https://cdnjs.cloudflare.com",
//           ],
//           fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
//           imgSrc: [
//             "'self'",
//             "data:",
//             "blob:",
//             "https://cdn.jsdelivr.net",
//             "https://cdnjs.cloudflare.com",
//             "https://ancoinnovation.com",
//           ],
//           connectSrc: [
//             "'self'",
//             "https://cdn.jsdelivr.net",
//             "https://ancoinnovation.com",
//           ],
//           objectSrc: ["'none'"],
//           frameAncestors: ["'none'"],
//           upgradeInsecureRequests: [],
//         },
//       },
//       referrerPolicy: { policy: "strict-origin-when-cross-origin" },
//       hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
//       noSniff: true,
//     })
//   );
// } else {
//   console.log("🧩 Running Helmet in DEVELOPMENT mode (relaxed CSP)");

//   // More permissive CSP for Vite dev
//   app.use(
//     helmet({
//       contentSecurityPolicy: false, // disable CSP locally
//       crossOriginResourcePolicy: { policy: "cross-origin" },
//       crossOriginEmbedderPolicy: false,
//       noSniff: true,
//     })
//   );
// }
app.use(cookieParser());
// app.use(cors({
//   origin: process.env.CLIENT_URL, // allow requests from 'http://localhost:5173','http://localhost:5174'
//   methods: ['GET', 'POST',"PUT","DELETE","PATCH",'OPTIONS'],  // your React app port
//   credentials: true                // allow cookies
// }));
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://192.168.0.114:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow Postman, curl and requests without an Origin header.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("Blocked CORS Origin:", origin);

        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    credentials: true,
}));



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//  app.use("/img/user", express.static(path.join(__dirname, "uploads/user")));
//  app.use("/qr", express.static(path.join(process.cwd(), "uploads/admin/qr")));
//  app.use("/admin/products", express.static(path.join(__dirname, "uploads/admin/products")));
 app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/public", express.static(path.join(process.cwd(), "public")));


 app.use("/api/user",userRoutes)
  app.use("/api/user/shop",shopRoutes)
 app.use("/api/admin",adminRoutes)
 app.use("/api",homeRoutes)
 app.use("/api/admin/qr",qrRoutes)
 app.use("/api/admin/product",productRoutes)
 app.use("/api/admin/shippingAndPurchase",shippingAndPurchaseRoutes)
 app.use("/api/admin/registered-members",registeredMembersRoutes)

 app.use("/api/user/profile",profileRoutes)
 
app.use("/api/admin/upload", uploadRoutes);

app.use("/api/admin/personnel", personnelRoutes);


//clearExpiredSessions();
//app.use(errorHandler)
const PORT = process.env.PORT || 4000;
// clearExpiredSessions();
// clearExpiredLoginAttempts();
// dailyStockCarryForward();
//  clearExpiredQr()
app.listen(PORT, (err) => {
  if (err) {
    //logger.error(`❌ Failed to start server on port ${PORT}`, err);
    process.exit(1);
  } else {
    console.log(`Server running on port ${PORT}`); // optional plain console
  }
});



