import csv
from datetime import date
import io
from pathlib import Path
import duckdb

BASE_DIR = Path(__file__).resolve().parent.parent.parent
_NEW_DB = BASE_DIR / "data" / "data.duckdb"
_LEGACY_DB = BASE_DIR / "data" / "data2.duckdb"
DB_PATH = str(_NEW_DB if _NEW_DB.exists() else _LEGACY_DB)
TABLE_NAME = "harmonized_hotspots"


def get_db_connection():
    return duckdb.connect(database=DB_PATH, read_only=True)


def build_aoi_filter(aoi_lat=None, aoi_lon=None, aoi_radius=None):
    """Build a parameterized Haversine distance SQL clause (in km) for an AOI."""
    if all(v is not None for v in (aoi_lat, aoi_lon, aoi_radius)):
        clause = """
            AND (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                ))
            )) <= ?
        """
        params = [
            float(aoi_lat),
            float(aoi_lon),
            float(aoi_lat),
            float(aoi_radius),
        ]
        return clause, params
    return "", []


def get_hotspots(
    year=None,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
    min_frp=None,
    limit=1000,
):
    """Query harmonized hotspot points from DuckDB with optional filters."""
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        query = f"""
            SELECT 
                latitude AS lat,
                longitude AS lon,
                frp,
                brightness,
                confidence,
                acq_date,
                daynight,
                pixel_count,
                is_ghost,
                sensor,
                type,
                confidence,
                scan,
                track,
                type,
                satellite, 
                instrument,
                bright_t31
            FROM {TABLE_NAME}
            WHERE 1=1
        """
        params = []

        if year is not None:
            query += " AND EXTRACT(year FROM acq_date) = ?"
            params.append(int(year))

        if is_calibrated:
            query += " AND is_ghost = FALSE"

        if min_frp is not None:
            query += " AND frp >= ?"
            params.append(float(min_frp))

        aoi_clause, aoi_params = build_aoi_filter(aoi_lat, aoi_lon, aoi_radius)
        query += aoi_clause
        params.extend(aoi_params)

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
    """Aggregate daily fire activity into the 7-row x 52-column calendar grid."""
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        query = f"""
            SELECT 
                acq_date,
                EXTRACT(dow FROM acq_date) AS dow,
                EXTRACT(week FROM acq_date) AS week,
                COUNT(*) AS count,
                ROUND(SUM(frp), 1) AS total_frp
            FROM {TABLE_NAME}
            WHERE EXTRACT(year FROM acq_date) = ?
        """
        params = [int(year)]

        if is_calibrated:
            query += " AND is_ghost = FALSE"

        aoi_clause, aoi_params = build_aoi_filter(aoi_lat, aoi_lon, aoi_radius)
        query += aoi_clause
        params.extend(aoi_params)

        query += " GROUP BY acq_date, dow, week ORDER BY acq_date ASC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

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

        for acq_date, dow, week, count, total_frp in rows:
            col = min(51, max(0, int(week) - 1))
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


def export_hotspots_csv(
    year=2024,
    is_calibrated=True,
    aoi_lat=None,
    aoi_lon=None,
    aoi_radius=None,
    aoi_name="Canada_National",
    limit=None,
):
    """Export active fire detections for the selected view as a CSV string."""
    connection = get_db_connection()
    try:
        cursor = connection.cursor()

        query = f"""
            SELECT 
                acq_date AS date,
                latitude,
                longitude,
                ROUND(frp, 1) AS frp_megawatts,
                brightness,
                confidence AS harmonized_confidence,
                daynight,
                sensor,
                CASE WHEN is_ghost THEN 'GHOST_EMBER_FILTERED' ELSE 'VEGETATION_WILDFIRE' END AS classification,
                ? AS aoi_filter
            FROM {TABLE_NAME}
            WHERE EXTRACT(year FROM acq_date) = ?
        """
        params = [aoi_name, int(year)]

        if is_calibrated:
            query += " AND is_ghost = FALSE"

        aoi_clause, aoi_params = build_aoi_filter(aoi_lat, aoi_lon, aoi_radius)
        query += aoi_clause
        params.extend(aoi_params)

        query += " ORDER BY frp DESC"
        if limit is not None:
            query += " LIMIT ?"
            params.append(int(limit))

        rows = cursor.execute(query, params).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "date",
                "latitude",
                "longitude",
                "frp_megawatts",
                "brightness",
                "harmonized_confidence",
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

