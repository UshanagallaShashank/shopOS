# ShopOS API entry point — registers all routers and global middleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, orgs, products, orders

app = FastAPI(title="ShopOS API", version="1.0.0")

# Allow Next.js frontend (port 3000/3001) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Each router owns its prefix — adding new resources = adding one line here
app.include_router(health.router, tags=["Health"])
app.include_router(orgs.router, prefix="/orgs", tags=["Orgs"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
