from flask import Blueprint, jsonify, request, Response
from backend.analytics import get_historical_comparison, get_summary
from backend.data_extraction import (
    export_hotspots_csv,
    get_calendar_matrix,
    get_hotspots,
)

api_bp = Blueprint("api", __name__)


@api_bp.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "service": "NASA Fire Hotspots API (MODIS & VIIRS)",
        "endpoints": [
            "/api/hotspots",
            "/api/calendar",
            "/api/summary",
            "/api/analytics",
            "/api/export",
        ],
    })


@api_bp.route("/api/hotspots", methods=["GET"])
def hotspots_endpoint():
    year = request.args.get("year", default=2024, type=int)
    is_calibrated = request.args.get("calibrated", default="true").lower() == "true"
    aoi_lat = request.args.get("aoi_lat", type=float)
    aoi_lon = request.args.get("aoi_lon", type=float)
    aoi_radius = request.args.get("aoi_radius", type=float)
    min_frp = request.args.get("min_frp", type=float)
    limit = request.args.get("limit", default=1000, type=int)

    data = get_hotspots(
        year=year,
        is_calibrated=is_calibrated,
        aoi_lat=aoi_lat,
        aoi_lon=aoi_lon,
        aoi_radius=aoi_radius,
        min_frp=min_frp,
        limit=limit,
    )
    return jsonify({"count": len(data), "data": data})


@api_bp.route("/api/calendar", methods=["GET"])
def calendar_endpoint():
    year = request.args.get("year", default=2024, type=int)
    is_calibrated = request.args.get("calibrated", default="true").lower() == "true"
    aoi_lat = request.args.get("aoi_lat", type=float)
    aoi_lon = request.args.get("aoi_lon", type=float)
    aoi_radius = request.args.get("aoi_radius", type=float)

    cells = get_calendar_matrix(
        year=year,
        is_calibrated=is_calibrated,
        aoi_lat=aoi_lat,
        aoi_lon=aoi_lon,
        aoi_radius=aoi_radius,
    )
    return jsonify(cells)


@api_bp.route("/api/summary", methods=["GET"])
def summary_endpoint():
    year = request.args.get("year", default=2024, type=int)
    month = request.args.get("month", type=int)
    aoi_lat = request.args.get("aoi_lat", type=float)
    aoi_lon = request.args.get("aoi_lon", type=float)
    aoi_radius = request.args.get("aoi_radius", type=float)

    summary_data = get_summary(
        year=year,
        month=month,
        aoi_lat=aoi_lat,
        aoi_lon=aoi_lon,
        aoi_radius=aoi_radius,
    )
    return jsonify(summary_data)


@api_bp.route("/api/analytics", methods=["GET"])
def analytics_endpoint():
    year = request.args.get("year", default=2024, type=int)
    month = request.args.get("month", type=int)
    is_calibrated = request.args.get("calibrated", default="true").lower() == "true"
    aoi_lat = request.args.get("aoi_lat", type=float)
    aoi_lon = request.args.get("aoi_lon", type=float)
    aoi_radius = request.args.get("aoi_radius", type=float)

    analytics_data = get_historical_comparison(
        year=year,
        month=month,
        is_calibrated=is_calibrated,
        aoi_lat=aoi_lat,
        aoi_lon=aoi_lon,
        aoi_radius=aoi_radius,
    )
    return jsonify(analytics_data)


@api_bp.route("/api/export", methods=["GET"])
def export_endpoint():
    year = request.args.get("year", default=2024, type=int)
    is_calibrated = request.args.get("calibrated", default="true").lower() == "true"
    aoi_lat = request.args.get("aoi_lat", type=float)
    aoi_lon = request.args.get("aoi_lon", type=float)
    aoi_radius = request.args.get("aoi_radius", type=float)
    aoi_name = request.args.get("aoi_name", default="Active_Area")
    limit = request.args.get("limit", default=None, type=int)

    csv_data = export_hotspots_csv(
        year=year,
        is_calibrated=is_calibrated,
        aoi_lat=aoi_lat,
        aoi_lon=aoi_lon,
        aoi_radius=aoi_radius,
        aoi_name=aoi_name,
        limit=limit,
    )

    clean_aoi_name = "".join(c if c.isalnum() else "_" for c in aoi_name)
    filename = f"nasa_fire_harmonized_{clean_aoi_name}_{year}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
