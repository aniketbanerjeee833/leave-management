// cronJobs.js
import cron from "node-cron";
import db from "../config/db.js";


const clearExpiredSessions = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      const [result] = await db.query(
        `DELETE FROM admin_sessions
         WHERE expires_at <= NOW()`
      );

      console.log(
        `[Session Cleanup] Deleted ${result.affectedRows} expired sessions.`
      );
    } catch (error) {
      console.error("[Session Cleanup] Failed:", error);
    }
  });

  console.log("Session cleanup cron job scheduled.");
};

export default clearExpiredSessions;