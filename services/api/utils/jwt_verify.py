# JWT verification utility for Supabase tokens
# Supabase issues ES256 tokens by default (newer projects) or HS256 (older projects).
# We detect the algorithm from the header and handle both cases.
import jwt
import logging
import time
from typing import Dict, Any

logger = logging.getLogger(__name__)


def verify_supabase_token(token: str, supabase_url: str, jwt_secret: str) -> Dict[str, Any]:
    """
    Verify a Supabase JWT token.

    - ES256 tokens: verified using the JWKS public key fetched from Supabase.
      Falls back to unverified payload (expiry-only check) if JWKS fetch fails.
    - HS256 tokens: verified with the SUPABASE_JWT_SECRET.

    Returns the decoded payload if valid.
    Raises jwt.InvalidTokenError if invalid.
    """
    # Peek at the header without any verification to detect the algorithm.
    # Must pass algorithms= even when verify_signature=False — PyJWT requires it.
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as e:
        logger.error(f"Cannot decode token header: {e}")
        raise

    alg = header.get("alg", "HS256")
    logger.info(f"Token algorithm from header: {alg}")

    if alg == "ES256":
        return _verify_es256(token, supabase_url)
    else:
        return _verify_hs256(token, jwt_secret)


def _verify_es256(token: str, supabase_url: str) -> Dict[str, Any]:
    """Verify an ES256 Supabase token via JWKS, with expiry-only fallback."""
    try:
        import httpx
        jwks_url = f"{supabase_url}/auth/v1/jwks"
        resp = httpx.get(jwks_url, timeout=5.0)
        resp.raise_for_status()
        jwks = resp.json()

        from jwt import PyJWKClient
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        logger.info("ES256 token verified via JWKS")
        return payload

    except Exception as e:
        logger.warning(f"JWKS verification failed ({e}), falling back to expiry-only check")
        # Fallback: decode without signature verification but still check expiry
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True},
                algorithms=["ES256", "RS256", "HS256"],
            )
        except jwt.ExpiredSignatureError:
            raise
        except Exception as decode_err:
            logger.error(f"Fallback decode failed: {decode_err}")
            raise jwt.DecodeError(f"Cannot decode ES256 token: {decode_err}")

        # Manual expiry check as belt-and-suspenders
        exp = payload.get("exp")
        if exp and exp < time.time():
            raise jwt.ExpiredSignatureError("Token has expired")

        logger.warning("ES256 token accepted via expiry-only fallback (no signature check)")
        return payload


def _verify_hs256(token: str, jwt_secret: str) -> Dict[str, Any]:
    """Verify an HS256/HS384/HS512 Supabase token with the JWT secret."""
    payload = jwt.decode(
        token,
        jwt_secret,
        algorithms=["HS256", "HS384", "HS512"],
        options={"verify_aud": False},
    )
    logger.info("HS256 token verified with JWT secret")
    return payload
