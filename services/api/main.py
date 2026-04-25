# ShopOS API entry point — registers all routers and global middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, orgs, products, orders, users, auth, invites

app = FastAPI(title="ShopOS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(orgs.router, prefix="/orgs", tags=["Orgs"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(invites.router, prefix="/invites", tags=["Invites"])


# Debug endpoint to test token verification
from fastapi import Request

@app.get("/debug/headers")
async def debug_headers(request: Request):
    """Debug endpoint to check all headers"""
    return {
        "headers": dict(request.headers),
        "has_authorization": "authorization" in request.headers,
    }

