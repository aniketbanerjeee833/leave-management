// import mysql from "mysql2/promise";

// // Create a connection pool with promise support
// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "", // your DB password
// //database: "finance-reseller-accounts-management",
// database: "restaurant-management-system",
// });

// // Test connection once at startup
// (async () => {
//   try {
//     const connection = await db.getConnection();
//     console.log("✅ MySQL Connected!");
//     connection.release(); // release back to pool
//   } catch (err) {
//     console.error("❌ DB Connection Failed:", err.message);
//   }
// })();

// export default db;
import mysql from "mysql2/promise";

// Create a connection pool with promise support
const db = mysql.createPool({

  host: 'localhost',
  // port:3306,
  user: "root",
  password: '',  // or your DB password
  database: "leave-management",

});
 
// Test connection once at startup
// (async () => {
//   try {
//     const connection = await db.getConnection();
//     console.log("✅ MySQL Connected!&quot ;
//     connection.release(); // release back to pool
//   } catch (err) {
//     console.error("❌ DB Connection Failed:", err.message);
//   }
// })();
// db.getConnection((err, connection) => {
//   if (err) {
//     console.error("DB Connection Failed:", err);
//   } else {
//     console.log("MySQL Connected") ;
//     connection.release();
//   }
// });
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected!");
    connection.release();
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
  }
})();
export default db;