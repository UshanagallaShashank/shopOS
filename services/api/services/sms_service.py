# SMS service — Twilio wrapper
# Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env to enable.
# If credentials are missing, SMS calls log a warning and return silently.
import asyncio
import logging

from config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    return bool(
        getattr(settings, "twilio_account_sid", None)
        and getattr(settings, "twilio_auth_token", None)
        and getattr(settings, "twilio_from_number", None)
        and settings.twilio_account_sid not in ("", "your-twilio-sid")
    )


def _send_sync(to: str, body: str) -> None:
    """Blocking Twilio call — run via asyncio.to_thread."""
    from twilio.rest import Client
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    msg = client.messages.create(
        body=body,
        from_=settings.twilio_from_number,
        to=to,
    )
    logger.info("[SMS] sent sid=%s to=%s", msg.sid, to)


async def _send_async(to: str, body: str) -> None:
    try:
        await asyncio.to_thread(_send_sync, to, body)
    except Exception as exc:
        logger.warning("[SMS] failed to=%s err=%s", to, exc)


def send(to: str | None, body: str) -> None:
    """
    Fire-and-forget SMS. Safe to call from any async context.
    Silently skips if `to` is falsy or Twilio is not configured.
    """
    if not to:
        return
    if not _is_configured():
        logger.debug("[SMS] not configured — would send to %s: %s", to, body)
        return
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_send_async(to, body))
    except RuntimeError:
        # No running loop (e.g. tests) — skip
        pass


# ── Message templates ────────────────────────────────────────────────────────

def welcome(phone: str, name: str | None = None) -> None:
    greet = f"Hi {name}!" if name else "Welcome!"
    send(phone, f"{greet} Your ShopOS account is ready. Happy shopping! 🛍️")


def order_placed(phone: str, order_id: str, total: float, shop_name: str) -> None:
    send(
        phone,
        f"ShopOS: Order #{order_id[:8]} placed at {shop_name} for "
        f"₹{total:,.0f}. We'll update you when it's confirmed.",
    )


def order_confirmed(phone: str, order_id: str, shop_name: str) -> None:
    send(
        phone,
        f"ShopOS: Great news! Order #{order_id[:8]} from {shop_name} is confirmed "
        f"and being prepared.",
    )


def order_shipped(
    phone: str, order_id: str, courier: str | None, tracking: str | None
) -> None:
    details = ""
    if courier:
        details += f" via {courier}"
    if tracking:
        details += f" (AWB: {tracking})"
    send(
        phone,
        f"ShopOS: Order #{order_id[:8]} is on its way!{details} "
        f"Expect delivery in 1-3 days.",
    )


def order_delivered(phone: str, order_id: str) -> None:
    send(
        phone,
        f"ShopOS: Order #{order_id[:8]} has been delivered! "
        f"Enjoy your purchase. Thank you for shopping with us.",
    )


def order_cancelled(phone: str, order_id: str) -> None:
    send(
        phone,
        f"ShopOS: Order #{order_id[:8]} has been cancelled. "
        f"Contact support if you have any questions.",
    )


def org_request_approved(phone: str, org_name: str) -> None:
    send(
        phone,
        f"ShopOS: Congrats! Your store request for '{org_name}' has been approved. "
        f"Log in to set up your shop.",
    )
