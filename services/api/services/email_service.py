# Email service — Resend wrapper (Supabase's recommended email provider)
# Set RESEND_API_KEY and EMAIL_FROM in .env to enable.
# If credentials are missing, calls log at DEBUG level and return silently.
import asyncio
import logging

from config import settings

logger = logging.getLogger(__name__)


def _is_configured() -> bool:
    key = getattr(settings, "resend_api_key", "")
    return bool(key and key not in ("", "re_your_key_here"))


def _send_sync(to: str, subject: str, html: str) -> None:
    """Blocking Resend API call — run via asyncio.to_thread."""
    import resend  # type: ignore
    resend.api_key = settings.resend_api_key
    resend.Emails.send({
        "from": settings.email_from,
        "to": [to],
        "subject": subject,
        "html": html,
    })
    logger.info("[EMAIL] sent to=%s subject=%r", to, subject)


async def _send_async(to: str, subject: str, html: str) -> None:
    try:
        await asyncio.to_thread(_send_sync, to, subject, html)
    except Exception as exc:
        logger.warning("[EMAIL] failed to=%s err=%s", to, exc)


def send(to: str | None, subject: str, html: str) -> None:
    """
    Fire-and-forget email. Safe to call from any async context.
    Silently skips if `to` is falsy or Resend is not configured.
    """
    if not to:
        return
    if not _is_configured():
        logger.debug("[EMAIL] not configured — would send to %s: %s", to, subject)
        return
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_send_async(to, subject, html))
    except RuntimeError:
        pass


# ── HTML helpers ─────────────────────────────────────────────────────────────

def _wrap(title: str, body: str) -> str:
    """Minimal branded email shell."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;border:1px solid #262626;overflow:hidden;max-width:560px">
        <tr>
          <td style="padding:24px 32px;background:#141414;border-bottom:1px solid #262626">
            <span style="font-size:22px;font-weight:700;color:#e5e5e5">Shop<span style="color:#a855f7">OS</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#f5f5f5">{title}</h2>
            {body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#0f0f0f;border-top:1px solid #262626;font-size:12px;color:#737373;text-align:center">
            ShopOS — the unified commerce platform. You received this because you have an account with us.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _p(text: str) -> str:
    return f'<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#d4d4d4">{text}</p>'


def _pill(text: str, color: str = "#a855f7") -> str:
    return (
        f'<span style="display:inline-block;padding:4px 10px;border-radius:999px;'
        f'background:{color}22;color:{color};font-size:12px;font-weight:600">{text}</span>'
    )


def _mono(text: str) -> str:
    return f'<code style="font-family:monospace;background:#1a1a1a;padding:2px 6px;border-radius:4px;font-size:13px;color:#c084fc">{text}</code>'


# ── Message templates ────────────────────────────────────────────────────────

def welcome(email: str | None, name: str | None = None) -> None:
    if not email:
        return
    greet = name.split("@")[0] if name else "there"
    html = _wrap(
        "Welcome to ShopOS!",
        _p(f"Hi <strong>{greet}</strong>, your ShopOS account is ready.")
        + _p("You can now browse shops, place orders, and track deliveries — all in one place.")
        + _p("Happy shopping! 🛍️"),
    )
    send(email, "Welcome to ShopOS!", html)


def order_placed(email: str | None, order_id: str, total: float, shop_name: str) -> None:
    html = _wrap(
        "Order Placed",
        _p(f"Your order at <strong>{shop_name}</strong> has been placed successfully.")
        + f'<div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:16px 0">'
        + f'<p style="margin:0 0 6px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:.05em">Order ID</p>'
        + f'{_mono(order_id[:8].upper())}'
        + f'<p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#a855f7">₹{total:,.0f}</p></div>'
        + _p("We'll notify you as soon as the store confirms your order."),
    )
    send(email, f"Order Placed — ₹{total:,.0f} at {shop_name}", html)


def order_confirmed(email: str | None, order_id: str, shop_name: str) -> None:
    html = _wrap(
        "Order Confirmed ✓",
        _p(f"Great news! <strong>{shop_name}</strong> has confirmed your order {_mono(order_id[:8].upper())}.")
        + _p("Your items are being prepared and will be dispatched soon."),
    )
    send(email, f"Order Confirmed — {shop_name}", html)


def order_shipped(
    email: str | None, order_id: str, courier: str | None, tracking: str | None
) -> None:
    details = ""
    if courier or tracking:
        details = (
            '<div style="background:#1a1a1a;border-radius:8px;padding:14px;margin:16px 0">'
        )
        if courier:
            details += f'<p style="margin:0 0 4px;font-size:13px;color:#d4d4d4"><strong>Courier:</strong> {courier}</p>'
        if tracking:
            details += f'<p style="margin:0;font-size:13px;color:#d4d4d4"><strong>Tracking:</strong> {_mono(tracking)}</p>'
        details += "</div>"

    html = _wrap(
        "Your Order is On Its Way 🚚",
        _p(f"Order {_mono(order_id[:8].upper())} has been shipped!")
        + details
        + _p("Expected delivery in 1–3 business days."),
    )
    send(email, f"Order Shipped — #{order_id[:8].upper()}", html)


def order_delivered(email: str | None, order_id: str) -> None:
    html = _wrap(
        "Order Delivered 🎉",
        _p(f"Order {_mono(order_id[:8].upper())} has been delivered!")
        + _p("We hope you love your purchase. If anything is wrong, contact the store for support.")
        + _p("Thank you for shopping with ShopOS!"),
    )
    send(email, f"Order Delivered — #{order_id[:8].upper()}", html)


def order_cancelled(email: str | None, order_id: str) -> None:
    html = _wrap(
        "Order Cancelled",
        _p(f"Order {_mono(order_id[:8].upper())} has been cancelled.")
        + _p("If you did not request this cancellation, please contact the store directly."),
    )
    send(email, f"Order Cancelled — #{order_id[:8].upper()}", html)


def org_request_approved(email: str | None, org_name: str) -> None:
    html = _wrap(
        "Your Store is Approved! 🎊",
        _p(f"Congratulations! Your request to create <strong>{org_name}</strong> has been approved.")
        + _p("Your account has been upgraded to <strong>Org Admin</strong>. Log in to set up your store, add products, and start selling.")
        + f'<p style="margin:20px 0 0"><a href="/" style="display:inline-block;padding:10px 20px;background:#a855f7;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Go to my store →</a></p>',
    )
    send(email, f"Store Approved — {org_name}", html)


def org_request_rejected(email: str | None, org_name: str) -> None:
    html = _wrap(
        "Store Request Update",
        _p(f"Your request to create <strong>{org_name}</strong> was not approved at this time.")
        + _p("You can contact our support team if you have questions or wish to reapply."),
    )
    send(email, f"Store Request Update — {org_name}", html)


def send_notification(email: str | None, title: str, message: str) -> None:
    """Generic notification email"""
    if not email:
        return
    html = _wrap(
        title,
        _p(message),
    )
    send(email, title, html)
