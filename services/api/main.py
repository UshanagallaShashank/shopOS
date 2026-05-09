# ShopOS API entry point — registers all routers and global middleware
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings
from routers import health, orgs, products, orders, users, auth, invites, org_requests, reviews, cart, notifications

# Import all models to register them with SQLAlchemy
import models  # noqa: F401

app = FastAPI(title="ShopOS API", version="1.0.0")

# CORS configuration - MUST be added BEFORE other middleware
# In development, allow all origins for easier testing
if settings.debug:
    allowed_origins = ["*"]
    print(f"[CORS] Debug mode: Allowing ALL origins (*)")
else:
    allowed_origins = settings.allowed_origins if isinstance(settings.allowed_origins, list) else [settings.allowed_origins]
    print(f"[CORS] Production mode: Allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Global exception handlers to ensure CORS headers on errors
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*" if settings.debug else request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*" if settings.debug else request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*" if settings.debug else request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(orgs.router, prefix="/orgs", tags=["Orgs"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(invites.router, prefix="/invites", tags=["Invites"])
app.include_router(org_requests.router, prefix="/org-requests", tags=["Org Requests"])
app.include_router(reviews.router, tags=["Reviews"])
app.include_router(cart.router, prefix="/cart", tags=["Cart"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])


# Debug endpoint to test token verification
from fastapi import Request

@app.get("/debug/headers")
async def debug_headers(request: Request):
    """Debug endpoint to check all headers"""
    return {
        "headers": dict(request.headers),
        "has_authorization": "authorization" in request.headers,
    }

