# Reusable pagination — any list route uses Depends(paginate)
from fastapi import Query


def paginate(
    skip: int = Query(default=0, ge=0, description="Records to skip"),
    limit: int = Query(default=20, ge=1, le=500, description="Max records to return"),
) -> dict:
    # Returns dict so routes can unpack: page["skip"], page["limit"]
    return {"skip": skip, "limit": limit}
