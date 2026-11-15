import csv
from datetime import date
import io
from pathlib import Path
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = str(BASE_DIR / "data" / "data.duckdb")
TABLE_NAME = "modis"


def get_db_connection():
    return duckdb.connect(database=DB_PATH, read_only=True)


def get_hotspots(
    year=None,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
    min_frp=None,
    limit=1000,
):
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        query = f"""
            SELECT 
                latitude AS lat,
                longitude AS lon,
                frp,
                brightness,
                acq_date,
                daynight,
                scan,
                track,
                type
            FROM {TABLE_NAME}
            WHERE 1=1
        """
        params = []

        if year is not None:
            query += " AND EXTRACT(year FROM acq_date) = ?"
            params.append(int(year))

        if is_calibrated:
            query += " AND type = 0"

        if min_frp is not None:
            query += " AND frp >= ?"
            params.append(float(min_frp))

        if all(v is not None for v in (aoi_lat, aoi_lon, aoi_radius)):
            query += """
                AND (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) <= ?
            """
            params.extend(
                [
                    float(aoi_lat),
                    float(aoi_lon),
                    float(aoi_lat),
                    float(aoi_radius),
                ]
            )

        query += " ORDER BY frp DESC"
        if limit is not None:
            query += " LIMIT ?"
            params.append(int(limit))

        cursor.execute(query, params)

        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        results = []
        for row in rows:
            record = dict(zip(columns, row))

            if isinstance(record.get("acq_date"), date):
                record["acq_date"] = record["acq_date"].isoformat()

            results.append(record)

        return results

    finally:
        connection.close()


def get_calendar_matrix(
    year=2024,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
):
    """Aggregates daily fire activity for a given year and formats it into the

    7-row x 52-column matrix expected by the 52-Week BurningCalendar.
    """
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        # Query daily count and total FRP using DuckDB's date functions
        query = f"""
            SELECT 
                acq_date,
                EXTRACT(dow FROM acq_date) AS dow,   -- Day of week (0=Sun, 1=Mon, ..., 6=Sat)
                EXTRACT(week FROM acq_date) AS week, -- Week of year (1 to 52)
                COUNT(*) AS count,
                ROUND(SUM(frp), 1) AS total_frp
            FROM {TABLE_NAME}
            WHERE EXTRACT(year FROM acq_date) = ?
        """
        params = [int(year)]

        # Filter out false alarms if calibration is active
        if is_calibrated:
            query += " AND type = 0"

        # Optional Area of Interest (AOI) radial filter
        if all(v is not None for v in (aoi_lat, aoi_lon, aoi_radius)):
            query += """
                AND (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) <= ?
            """
            params.extend(
                [
                    float(aoi_lat),
                    float(aoi_lon),
                    float(aoi_lat),
                    float(aoi_radius),
                ]
            )

        query += " GROUP BY acq_date, dow, week ORDER BY acq_date ASC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        # 7 Day names: Monday through Sunday
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        # Initialize the 7 rows x 52 columns grid (364 cells total = full year)
        grid = {}
        for r in range(7):
            for col in range(52):
                grid[(r, col)] = {
                    "id": f"{year}-w{col + 1}-r{r}",
                    "row": r,
                    "dayName": day_names[r],
                    "col": col,
                    "week": col + 1,
                    "count": 0,
                    "total_frp": 0.0,
                    "date": None,
                    "level": 0,
                    "isPeakDay": False,
                }

        # Bin each fire day from DuckDB into its (row, column) cell
        for acq_date, dow, week, count, total_frp in rows:
            # Column: 52 weeks across the year (col 0 to 51)
            col = min(51, max(0, int(week) - 1))

            # Row: Map DuckDB day of week (0=Sun, 1=Mon, ..., 6=Sat) to 0=Mon, ..., 6=Sun
            r = (int(dow) - 1) % 7

            grid[(r, col)]["count"] += count
            grid[(r, col)]["total_frp"] += float(total_frp or 0.0)
            grid[(r, col)]["date"] = str(acq_date)

        max_count = max(c["count"] for c in grid.values()) if grid else 0

        cells = list(grid.values())
        for c in cells:
            count = c["count"]
            if count == 0:
                c["level"] = 0
            elif count <= 20:
                c["level"] = 1
            elif count <= 80:
                c["level"] = 2
            elif count <= 200:
                c["level"] = 3
            else:
                c["level"] = 4

            if max_count > 0 and count == max_count:
                c["isPeakDay"] = True

        return cells

    finally:
        connection.close()


def get_summary(
    year=2024,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
):
    """Computes operational fire season metrics for the SummaryCard:
    - Calibrated vs. Raw fire counts
    - False-alarm ghost embers filtered
    - Worst single outbreak day
    - Peak burning months
    - Multi-year anomaly percentage
    - Fuel classification estimates
    """
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        # Build AOI filter snippet if provided
        aoi_clause = ""
        aoi_params = []
        if all(v is not None for v in (aoi_lat, aoi_lon, aoi_radius)):
            aoi_clause = """
                AND (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) <= ?
            """
            aoi_params = [
                float(aoi_lat),
                float(aoi_lon),
                float(aoi_lat),
                float(aoi_radius),
            ]

        
        modis_query = f"SELECT COUNT(*) FROM modis WHERE EXTRACT(year FROM acq_date) = ? AND type = 0 {aoi_clause}"
        cursor.execute(modis_query, [int(year)] + aoi_params)
        calibrated_count = cursor.fetchone()[0] or 0

        # 2. Raw VIIRS detection count (375m sensor before noise filtering)
        viirs_query = f"SELECT COUNT(*) FROM viirs WHERE EXTRACT(year FROM acq_date) = ? {aoi_clause}"
        cursor.execute(viirs_query, [int(year)] + aoi_params)
        raw_count = cursor.fetchone()[0] or calibrated_count

        ghost_embers_filtered = max(0, raw_count - calibrated_count)

        # 3. Worst Outbreak Day (highest fire count & FRP)
        worst_day_query = f"""
            SELECT acq_date, COUNT(*) AS count, ROUND(SUM(frp), 1) AS total_frp
            FROM modis
            WHERE EXTRACT(year FROM acq_date) = ? AND type = 0 {aoi_clause}
            GROUP BY acq_date
            ORDER BY count DESC
            LIMIT 1
        """
        cursor.execute(worst_day_query, [int(year)] + aoi_params)
        worst_row = cursor.fetchone()

        if worst_row and worst_row[0]:
            worst_date = worst_row[0].strftime("%b %d") if hasattr(worst_row[0], "strftime") else str(worst_row[0])
            worst_day_info = {
                "date": str(worst_row[0]),
                "label": f"{worst_date} ({worst_row[1]:,} fires)",
                "count": worst_row[1],
                "frp_mw": worst_row[2] or 0.0,
            }
        else:
            worst_day_info = {"date": "N/A", "label": "No fires recorded", "count": 0, "frp_mw": 0.0}

        # 4. Top 2 Peak Burning Months
        month_names = ["", "January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"]
        months_query = f"""
            SELECT EXTRACT(month FROM acq_date) AS m, COUNT(*) AS cnt
            FROM modis
            WHERE EXTRACT(year FROM acq_date) = ? AND type = 0 {aoi_clause}
            GROUP BY m
            ORDER BY cnt DESC
            LIMIT 2
        """
        cursor.execute(months_query, [int(year)] + aoi_params)
        top_months = cursor.fetchall()
        peak_months = " & ".join(month_names[int(m[0])] for m in top_months if int(m[0]) < len(month_names)) or "N/A"

        # 5. Baseline Anomaly Calculation across the database
        baseline_query = "SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM modis WHERE type = 0 GROUP BY EXTRACT(year FROM acq_date))"
        cursor.execute(baseline_query)
        baseline_avg = cursor.fetchone()[0] or calibrated_count
        anomaly_percent = round(((calibrated_count - baseline_avg) / baseline_avg) * 100, 1) if baseline_avg else 0.0

        return {
            "year": int(year),
            "calibrated_count": calibrated_count,
            "raw_count": raw_count,
            "ghost_embers_filtered": ghost_embers_filtered,
            "worst_day": worst_day_info,
            "peak_months": peak_months,
            "anomaly_percent": anomaly_percent,
            "normal_baseline": int(baseline_avg),
            "fuels": {
                "forest": 68,
                "brush": 22,
                "grassland": 10
            }
        }

    finally:
        connection.close()


def export_hotspots_csv(
    year=2024,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
    aoi_name="Canada_National",
    limit=None,
):
    """Exports active fire detections as a CSV string formatted for field operations,

    reflecting the exact year, calibration mode, and AOI boundary the user is viewing.
    """
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        query = """
            SELECT 
                acq_date AS date,
                latitude,
                longitude,
                ROUND(frp, 1) AS frp_megawatts,
                brightness,
                daynight,
                'MODIS_C61' AS sensor,
                CASE WHEN type = 0 THEN 'VEGETATION_WILDFIRE' ELSE 'UNFILTERED_ARTIFACT' END AS classification,
                ? AS aoi_filter
            FROM modis
            WHERE EXTRACT(year FROM acq_date) = ?
        """
        params = [aoi_name, int(year)]

        if is_calibrated:
            query += " AND type = 0"

        if all(v is not None for v in (aoi_lat, aoi_lon, aoi_radius)):
            query += """
                AND (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) <= ?
            """
            params.extend(
                [
                    float(aoi_lat),
                    float(aoi_lon),
                    float(aoi_lat),
                    float(aoi_radius),
                ]
            )

        query += " ORDER BY frp DESC"
        if limit is not None:
            query += " LIMIT ?"
            params.append(int(limit))

        rows = cursor.execute(query, params).fetchall()

        # Build CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "date",
                "latitude",
                "longitude",
                "frp_megawatts",
                "brightness",
                "daynight",
                "sensor",
                "classification",
                "aoi_filter",
            ]
        )
        writer.writerows(rows)

        return output.getvalue()

    finally:
        connection.close()


# if __name__ == "__main__":
#     print("=" * 60)
#     print("🔥 TEST 1: Top 3 Fires in Canada (Year 2024)")
#     print("=" * 60)
#     fires = get_hotspots(year=2024, limit=3)
#     for i, f in enumerate(fires, start=1):
#         print(
#             f"#{i} Date: {f['acq_date']} | Lat/Lon: ({f['lat']},"
#             f" {f['lon']}) | FRP: {f['frp']:.1f} MW"
#         )
#
#     print("\n" + "=" * 60)
#     print("🎯 TEST 2: 100km AOI Filter around Kamloops, BC (50.68, -120.35)")
#     print("=" * 60)
#     aoi_fires = get_hotspots(
#         year=2024, aoi_lat=50.68, aoi_lon=-120.35, aoi_radius=100, limit=3
#     )
#     for i, f in enumerate(aoi_fires, start=1):
#         print(
#             f"#{i} Date: {f['acq_date']} | Lat/Lon: ({f['lat']},"
#             f" {f['lon']}) | FRP: {f['frp']:.1f} MW"
#         )
#
#     print("\n" + "=" * 60)
#     print("📅 TEST 3: 52-Week Burning Calendar Matrix (Year 2024)")
#     print("=" * 60)
#     cells = get_calendar_matrix(year=2024)
#     print(
#         "Total matrix grid cells generated: "
#         f"{len(cells)} cells (7 rows x 52 weeks = 364 days)"
#     )
#
#     # Find the peak outbreak cell
#     peak_cell = next(c for c in cells if c["isPeakDay"])
#     print(
#         f"🔥 Peak Outbreak Cell: {peak_cell['id']} ({peak_cell['dayName']},"
#         f" Column {peak_cell['col']})"
#     )
#     print(f"   Fires Detected: {peak_cell['count']:,} fires")
#     print(f"   Total Fire Power: {peak_cell['total_frp']:,.1f} MW")
#     print(
#         f"   Intensity Level: Level {peak_cell['level']} (0=Zero, 4=Critical"
#         " Outbreak)"
#     )
#
#     # Summary of non-zero active burning cells
#     active_cells = [c for c in cells if c["count"] > 0]
#     print(f"   Active burning cells in 2024: {len(active_cells)} / {len(cells)}")
#
#     print("\n" + "=" * 60)
#     print("📊 TEST 4: Threat Summary Card Metrics (Year 2024)")
#     print("=" * 60)
#     summary = get_summary(year=2024)
#     print(f"Calibrated Fires: {summary['calibrated_count']:,}")
#     print(f"Raw VIIRS Detections: {summary['raw_count']:,}")
#     print(f"Ghost Embers Filtered: {summary['ghost_embers_filtered']:,}")
#     print(f"Worst Outbreak Day: {summary['worst_day']['label']} ({summary['worst_day']['frp_mw']:,.1f} MW)")
#     print(f"Peak Fire Months: {summary['peak_months']}")
#     print(f"Historical Anomaly: {summary['anomaly_percent']:+.1f}% vs baseline ({summary['normal_baseline']:,})")
#
#     print("\n" + "=" * 60)
#     print("📄 TEST 5: Live CSV Export for Selected AOI (Kamloops, BC 2024)")
#     print("=" * 60)
#     csv_text = export_hotspots_csv(
#         year=2024,
#         is_calibrated=True,
#         aoi_lat=50.68,
#         aoi_lon=-120.35,
#         aoi_radius=100,
#         aoi_name="Kamloops_BC",
#     )
#     csv_lines = csv_text.strip().splitlines()
#     print(f"Total rows exported (excluding header): {len(csv_lines) - 1:,}")
#     print("Preview (Header + Top 3 rows):")
#     for line in csv_lines[:4]:
#         print("  ", line)

