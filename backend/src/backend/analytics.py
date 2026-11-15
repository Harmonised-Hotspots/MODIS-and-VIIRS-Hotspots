from backend.data_extraction import (
    TABLE_NAME,
    build_aoi_filter,
    get_db_connection,
)

MONTH_NAMES_FULL = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]

MONTH_NAMES_SHORT = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]


def _pct_change(current, baseline):
    """Return rounded percentage change relative to a historical median baseline."""
    if not baseline:
        return 0.0
    return round(((current - baseline) / baseline) * 100, 1)


def get_summary(
    year=2024,
    month=None,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
):

    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        aoi_clause, aoi_params = build_aoi_filter(aoi_lat, aoi_lon, aoi_radius)

        calibrated_query = (
            f"SELECT COUNT(*) FROM {TABLE_NAME} "
            f"WHERE EXTRACT(year FROM acq_date) = ? AND is_ghost = FALSE {aoi_clause}"
        )
        cursor.execute(calibrated_query, [int(year)] + aoi_params)
        calibrated_count = cursor.fetchone()[0] or 0

        viirs_query = (
            f"SELECT COUNT(*) FROM viirs WHERE EXTRACT(year FROM acq_date) = ? {aoi_clause}"
        )
        cursor.execute(viirs_query, [int(year)] + aoi_params)
        viirs_raw = cursor.fetchone()[0] or 0

        modis_query = (
            f"SELECT COUNT(*) FROM modis WHERE EXTRACT(year FROM acq_date) = ? {aoi_clause}"
        )
        cursor.execute(modis_query, [int(year)] + aoi_params)
        modis_raw = cursor.fetchone()[0] or 0

        raw_count = viirs_raw + modis_raw
        ghost_embers_filtered = max(0, raw_count - calibrated_count)


        worst_day_query = f"""
            SELECT acq_date, COUNT(*) AS count, ROUND(SUM(frp), 1) AS total_frp
            FROM {TABLE_NAME}
            WHERE EXTRACT(year FROM acq_date) = ? AND is_ghost = FALSE {aoi_clause}
            GROUP BY acq_date
            ORDER BY count DESC
            LIMIT 1
        """
        cursor.execute(worst_day_query, [int(year)] + aoi_params)
        worst_row = cursor.fetchone()

        if worst_row and worst_row[0]:
            worst_date = (
                worst_row[0].strftime("%b %d")
                if hasattr(worst_row[0], "strftime")
                else str(worst_row[0])
            )
            worst_day_info = {
                "date": str(worst_row[0]),
                "label": f"{worst_date} ({worst_row[1]:,} fires)",
                "count": worst_row[1],
                "frp_mw": worst_row[2] or 0.0,
            }
        else:
            worst_day_info = {
                "date": "N/A",
                "label": "No fires recorded",
                "count": 0,
                "frp_mw": 0.0,
            }

        months_query = f"""
            SELECT EXTRACT(month FROM acq_date) AS m, COUNT(*) AS cnt
            FROM {TABLE_NAME}
            WHERE EXTRACT(year FROM acq_date) = ? AND is_ghost = FALSE {aoi_clause}
            GROUP BY m
            ORDER BY cnt DESC
            LIMIT 2
        """
        cursor.execute(months_query, [int(year)] + aoi_params)
        top_months = cursor.fetchall()
        peak_months = (
            " & ".join(
                MONTH_NAMES_FULL[int(m[0])]
                for m in top_months
                if int(m[0]) < len(MONTH_NAMES_FULL)
            )
            or "N/A"
        )
        # 5. Historical MEDIAN baseline for this exact AOI across all years
        baseline_query = f"""
            WITH years AS (
                SELECT DISTINCT EXTRACT(year FROM acq_date)::INTEGER AS y FROM {TABLE_NAME}
            ),
            yearly_counts AS (
                SELECT EXTRACT(year FROM acq_date)::INTEGER AS y, COUNT(*) AS cnt
                FROM {TABLE_NAME}
                WHERE is_ghost = FALSE {aoi_clause}
                GROUP BY y
            )
            SELECT MEDIAN(COALESCE(yc.cnt, 0))
            FROM years y
            LEFT JOIN yearly_counts yc ON y.y = yc.y
        """
        cursor.execute(baseline_query, aoi_params)
        baseline_median = cursor.fetchone()[0] or calibrated_count
        anomaly_percent = _pct_change(calibrated_count, baseline_median)

        result = {
            "year": int(year),
            "calibrated_count": calibrated_count,
            "raw_count": raw_count,
            "ghost_embers_filtered": ghost_embers_filtered,
            "worst_day": worst_day_info,
            "peak_months": peak_months,
            "anomaly_percent": anomaly_percent,
            "normal_baseline": int(round(baseline_median)),
            "fuels": {"forest": 68, "brush": 22, "grassland": 10},
        }

        if month is not None:
            comparison = get_historical_comparison(
                year=year,
                month=month,
                is_calibrated=True,
                aoi_lat=aoi_lat,
                aoi_lon=aoi_lon,
                aoi_radius=aoi_radius,
            )
            result["selected_month"] = comparison["selected_month"]

        return result

    finally:
        connection.close()


def get_historical_comparison(
    year=2024,
    month=None,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
):
    """Compare yearly and monthly fire activity against historical medians for an AOI.

    Answers:
    1. Which years had the highest fire activity in the selected area.
    2. Which months in the selected year had the highest fire activity.
    3. How the current/selected month compares to that area's historical median.
    """
    connection = get_db_connection()
    try:
        cursor = connection.cursor()
        aoi_clause, aoi_params = build_aoi_filter(aoi_lat, aoi_lon, aoi_radius)
        cal_clause = "AND is_ghost = FALSE" if is_calibrated else ""

        # 1. Multi-year trajectory for the selected AOI
        yearly_query = f"""
            WITH all_years AS (
                SELECT DISTINCT EXTRACT(year FROM acq_date)::INTEGER AS year
                FROM {TABLE_NAME}
            ),
            harmonized_yearly AS (
                SELECT
                    EXTRACT(year FROM acq_date)::INTEGER AS year,
                    COUNT(*) FILTER (WHERE is_ghost = FALSE) AS calibrated_count,
                    ROUND(SUM(frp) FILTER (WHERE is_ghost = FALSE), 1) AS total_frp
                FROM {TABLE_NAME}
                WHERE 1=1 {aoi_clause}
                GROUP BY year
            ),
            raw_viirs_yearly AS (
                SELECT EXTRACT(year FROM acq_date)::INTEGER AS year, COUNT(*) AS cnt
                FROM viirs
                WHERE 1=1 {aoi_clause}
                GROUP BY year
            ),
            raw_modis_yearly AS (
                SELECT EXTRACT(year FROM acq_date)::INTEGER AS year, COUNT(*) AS cnt
                FROM modis
                WHERE 1=1 {aoi_clause}
                GROUP BY year
            )
            SELECT
                ay.year,
                COALESCE(hy.calibrated_count, 0) AS calibrated_count,
                COALESCE(rv.cnt, 0) + COALESCE(rm.cnt, 0) AS raw_count,
                COALESCE(hy.total_frp, 0.0) AS total_frp
            FROM all_years ay
            LEFT JOIN harmonized_yearly hy ON ay.year = hy.year
            LEFT JOIN raw_viirs_yearly rv ON ay.year = rv.year
            LEFT JOIN raw_modis_yearly rm ON ay.year = rm.year
            ORDER BY ay.year ASC
        """
        cursor.execute(yearly_query, aoi_params * 3)
        yearly_rows = cursor.fetchall()

        max_year_count = max((r[1] for r in yearly_rows), default=0)
        yearly_trend = []
        peak_year = None
        for y, cal_cnt, raw_cnt, total_frp in yearly_rows:
            is_peak = max_year_count > 0 and cal_cnt == max_year_count
            entry = {
                "year": int(y),
                "calibrated_count": int(cal_cnt),
                "raw_count": int(raw_cnt),
                "total_frp": float(total_frp or 0.0),
                "is_peak_year": is_peak,
            }
            yearly_trend.append(entry)
            if is_peak:
                peak_year = entry

        # 2. Monthly activity for the selected year vs. historical median across all years
        monthly_query = f"""
            WITH years AS (
                SELECT DISTINCT EXTRACT(year FROM acq_date)::INTEGER AS y
                FROM {TABLE_NAME}
            ),
            months AS (
                SELECT UNNEST(RANGE(1, 13)) AS m
            ),
            all_ym AS (
                SELECT years.y, months.m FROM years CROSS JOIN months
            ),
            actual_ym AS (
                SELECT
                    EXTRACT(year FROM acq_date)::INTEGER AS y,
                    EXTRACT(month FROM acq_date)::INTEGER AS m,
                    COUNT(*) AS fire_count,
                    ROUND(SUM(frp), 1) AS total_frp
                FROM {TABLE_NAME}
                WHERE 1=1 {cal_clause} {aoi_clause}
                GROUP BY y, m
            ),
            full_ym AS (
                SELECT
                    a.y,
                    a.m,
                    COALESCE(act.fire_count, 0) AS fire_count,
                    COALESCE(act.total_frp, 0.0) AS total_frp
                FROM all_ym a
                LEFT JOIN actual_ym act ON a.y = act.y AND a.m = act.m
            ),
            medians AS (
                SELECT
                    m,
                    MEDIAN(fire_count) AS median_count,
                    ROUND(MEDIAN(total_frp), 1) AS median_frp
                FROM full_ym
                GROUP BY m
            )
            SELECT
                f.m AS month,
                f.fire_count AS current_count,
                med.median_count AS historical_median_count,
                f.total_frp AS current_frp,
                med.median_frp AS historical_median_frp
            FROM full_ym f
            JOIN medians med ON f.m = med.m
            WHERE f.y = ?
            ORDER BY f.m ASC
        """
        cursor.execute(monthly_query, aoi_params + [int(year)])
        monthly_rows = cursor.fetchall()

        max_month_count = max((r[1] for r in monthly_rows), default=0)
        monthly_comparison = []
        peak_month = None
        for m, cur_cnt, med_cnt, cur_frp, med_frp in monthly_rows:
            is_peak = max_month_count > 0 and cur_cnt == max_month_count
            entry = {
                "month": int(m),
                "month_name": MONTH_NAMES_SHORT[int(m)],
                "month_full": MONTH_NAMES_FULL[int(m)],
                "current_count": int(cur_cnt),
                "historical_median_count": round(float(med_cnt or 0.0), 1),
                "pct_vs_median": _pct_change(cur_cnt, med_cnt),
                "current_frp": float(cur_frp or 0.0),
                "historical_median_frp": float(med_frp or 0.0),
                "frp_pct_vs_median": _pct_change(cur_frp or 0.0, med_frp),
                "is_peak_month": is_peak,
            }
            monthly_comparison.append(entry)
            if is_peak:
                peak_month = entry

        selected_month = None
        if month is not None:
            selected_month = next(
                (item for item in monthly_comparison if item["month"] == int(month)),
                None,
            )
        if selected_month is None:
            selected_month = peak_month or (
                monthly_comparison[0] if monthly_comparison else None
            )

        return {
            "year": int(year),
            "is_calibrated": is_calibrated,
            "yearly_trend": yearly_trend,
            "peak_year": peak_year,
            "monthly_comparison": monthly_comparison,
            "peak_month": peak_month,
            "selected_month": selected_month,
        }

    finally:
        connection.close()
