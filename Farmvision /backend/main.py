import os
import uvicorn
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# Import our modular routes
from routes import (
    crops, quotes, land, market, soil_sense
)

load_dotenv()

app = FastAPI(title="FarmVision API")

# --- Remove 422 Error from Docs ---
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="FarmVision API",
        version="1.0.0",
        description="FarmVision Backend API",
        routes=app.routes,
    )
    for path in openapi_schema.get("paths", {}):
        for method in openapi_schema["paths"][path]:
            responses = openapi_schema["paths"][path][method].get("responses", {})
            if "422" in responses:
                del responses["422"]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation Error", "detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Modular Routers ---
app.include_router(crops.router, tags=["Crops"])
app.include_router(quotes.router, tags=["Quotes"])
app.include_router(land.router, tags=["Land"])
app.include_router(market.router, tags=["Market"])
app.include_router(soil_sense.router, tags=["Soil Sense"])

# -------------------------
# Root
# -------------------------
@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
    <head><title>FarmVision API</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:40px">
        <h1 style="color:#336791">FarmVision MongoDB Backend Running</h1>
        <p>System automatically migrated back to MongoDB as per project requirements.</p>
        <p>Open API docs:</p>
        <a href="/docs">/docs</a>
    </body>
    </html>
    """

if __name__ == "__main__":
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "5000"))
    uvicorn.run(app, host=host, port=port)