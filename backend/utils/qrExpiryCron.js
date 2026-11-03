// // cron/qrExpiryCron.js

// import cron from "node-cron";
// import db from "../config/db.js";


// function clearExpiredQr() {
// // 🕛 Runs every day at 12:00 PM
// cron.schedule("0 12 * * *", async () => {
//   let connection;

//   try {
//     console.log(" Running QR Expiry Cron...");

//     connection = await db.getConnection();

//     const [result] = await connection.query(
//       `UPDATE new_qr 
//        SET status = 2 
//        WHERE date3 < NOW() AND status != 2`
//     );

//     console.log(`✅ Expired QR updated: ${result.affectedRows}`);

//   } catch (err) {
//     console.error("❌ Cron Error:", err);
//   } finally {
//     if (connection) connection.release();
//   }
// });
// }

// export default clearExpiredQr;