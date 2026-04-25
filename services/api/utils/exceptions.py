# Custom HTTP exceptions — raise these in services, FastAPI converts to JSON automatically
from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    # Use when a requested resource doesn't exist in the DB
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ForbiddenError(HTTPException):
    # Use when the user is authenticated but lacks permission
    def __init__(self, detail: str = "Access denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(HTTPException):
    # Use when a unique constraint would be violated (duplicate slug, etc.)
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class UnauthorizedError(HTTPException):
    # Use when no valid auth token is present
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
