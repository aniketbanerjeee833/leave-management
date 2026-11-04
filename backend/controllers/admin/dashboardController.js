// import db from "../../config/db.js";
;

import db from "../../config/db.js";

const getPersonnelDashboard = async (req, res) => {
    try {
        const [
            [personnelCount],
            [todayLeaveCount],
            [monthlyLeaveCount],
            [todayLeaves],
        ] = await Promise.all([
            // Total personnel
            db.execute(`
                SELECT COUNT(*) AS total_personnel
                FROM personnel
            `),

            // Distinct personnel currently on leave today
            db.execute(`
                SELECT COUNT(DISTINCT personnel_id) AS on_leave_today
                FROM personnel_leaves
                WHERE from_date <= CURDATE()
                  AND to_date >= CURDATE()
            `),

            // Leave records starting in the current month
            db.execute(`
                SELECT COUNT(*) AS monthly_leave_records
                FROM personnel_leaves
                WHERE from_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                  AND from_date < DATE_ADD(
                      LAST_DAY(CURDATE()),
                      INTERVAL 1 DAY
                  )
            `),

            // Only leave records active today
            db.execute(`
                SELECT
                    pl.leave_id,
                    pl.personnel_id,
                    p.name,
                    p.wbp_id,
                    p.pts_chest_no,
                    p.home_district,
                    p.recruited_unit,

                    DATE_FORMAT(
                        pl.from_date,
                        '%Y-%m-%d'
                    ) AS from_date,

                    DATE_FORMAT(
                        pl.to_date,
                        '%Y-%m-%d'
                    ) AS to_date,

                    pl.from_time_period,
                    pl.to_time_period,
                    pl.remarks

                FROM personnel_leaves pl

                INNER JOIN personnel p
                    ON p.personnel_id = pl.personnel_id

                WHERE pl.from_date <= CURDATE()
                  AND pl.to_date >= CURDATE()

                ORDER BY
                    pl.from_date ASC,
                    pl.leave_id ASC
            `),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalPersonnel: Number(
                        personnelCount[0]?.total_personnel || 0
                    ),
                    onLeaveToday: Number(
                        todayLeaveCount[0]?.on_leave_today || 0
                    ),
                    monthlyLeaveRecords: Number(
                        monthlyLeaveCount[0]?.monthly_leave_records || 0
                    ),
                },
                todayLeaves,
            },
        });

    } catch (error) {
        console.error("Get personnel dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard data.",
        });
    }
};

export { getPersonnelDashboard };
