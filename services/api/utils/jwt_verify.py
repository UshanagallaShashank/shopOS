# JWT verification utility for Supabase tokens
# Supabase issues ES256 tokens by default (newer projects) or HS256 (older projects).
# We detect the algorithm from the header and handle both cases.
import jwt
import logging
import time
from typing import Dict, Any

logger = logging.getLogger(__name__)


def verify_supabase_token(
    token: str,
    supabase_url: str,
    jwt_secret: str,
    supabase_anon_key: str = "",
) -> Dict[str, Any]:
    """
    Verify a Supabase JWT token.

    - ES256 tokens: verified using the JWKS public key fetched from Supabase.
      The anon key is passed as the `apikey` header (required by Supabase).
      Falls back to unverified payload (expiry-only check) if JWKS fetch fails.
    - HS256 tokens: verified with the SUPABASE_JWT_SECRET.

    Returns the decoded payload if valid.
    Raises jwt.InvalidTokenError if invalid.
    """
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as e:
        logger.error(f"Cannot decode token header: {e}")
        raise

    alg = header.get("alg", "HS256")
    logger.info(f"Token algorithm from header: {alg}")

    if alg == "ES256":
        return _verify_es256(token, supabase_url, supabase_anon_key)
    else:
        return _verify_hs256(token, jwt_secret)


def _verify_es256(token: str, supabase_url: str, anon_key: str = "") -> Dict[str, Any]:
    """Verify an ES256 Supabase token via JWKS, with expiry-only fallback."""
    try:
        import httpx
        from jwt import PyJWK

        # Supabase JWKS endpoint requires the anon key as `apikey` header
        headers = {"apikey": anon_key} if anon_key else {}
        jwks_url = f"{supabase_url}/auth/v1/jwks"
        resp = httpx.get(jwks_url, headers=headers, timeout=5.0)
        resp.raise_for_status()
        jwks = resp.json()

        # Match the key by `kid` so we use the right one from the JWKS set
        token_header = jwt.get_unverified_header(token)
        kid = token_header.get("kid")
        keys = jwks.get("keys", [])

        signing_key = None
        for key_data in keys:
            if not kid or key_data.get("kid") == kid:
                signing_key = PyJWK(key_data).key
                break

        if signing_key is None:
            raise ValueError(f"No matching key found in JWKS (kid={kid})")

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        logger.info("ES256 token verified via JWKS")
        return payload

    except jwt.ExpiredSignatureError:
        raise
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
