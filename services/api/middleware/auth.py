# Firebase JWT middleware — verifies the token and returns the decoded user payload
import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from config import settings

bearer = HTTPBearer()

# Initialize Firebase once at import time — safe to call multiple times
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    # Raises 401 if token is expired, tampered, or from a different Firebase project
    try:
        return firebase_auth.verify_id_token(token.credentials)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
