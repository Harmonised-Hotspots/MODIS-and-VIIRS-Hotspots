from flask import Flask
from backend.routes import api_bp

app = Flask(__name__)


# Enable CORS for local Vite frontend development
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


# Register all API routes from routes.py
app.register_blueprint(api_bp)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
