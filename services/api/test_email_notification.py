#!/usr/bin/env python3
"""
Test email notifications
"""
import asyncio
from services import email_service, sms_service

def test_email():
    """Test sending an email"""
    print("\n🧪 Testing Email Service")
    print("=" * 50)
    
    # Test order shipped email
    email = "ushanagallashashank@gmail.com"  # Replace with your email
    order_id = "test-order-123"
    courier = "BlueDart"
    tracking = "TRK123456789"
    
    print(f"\n📧 Sending test email to: {email}")
    print(f"   Order ID: {order_id}")
    print(f"   Courier: {courier}")
    print(f"   Tracking: {tracking}")
    
    try:
        email_service.order_shipped(email, order_id, courier, tracking)
        print("\n✅ Email sent successfully!")
        print("\n📬 Check your inbox for the email")
        print("   (It may take a few seconds to arrive)")
    except Exception as e:
        print(f"\n❌ Failed to send email: {e}")
        print("\nPossible issues:")
        print("• Check RESEND_API_KEY in .env")
        print("• Verify email address is correct")
        print("• Check Resend dashboard for errors")

def test_sms():
    """Test sending an SMS"""
    print("\n\n🧪 Testing SMS Service")
    print("=" * 50)
    
    phone = "+918523060395"  # Replace with your phone
    order_id = "test-order-123"
    courier = "BlueDart"
    tracking = "TRK123456789"
    
    print(f"\n📱 Sending test SMS to: {phone}")
    print(f"   Order ID: {order_id}")
    
    try:
        sms_service.order_shipped(phone, order_id, courier, tracking)
        print("\n✅ SMS sent successfully!")
        print("\n📬 Check your phone for the SMS")
    except Exception as e:
        print(f"\n❌ Failed to send SMS: {e}")
        print("\nPossible issues:")
        print("• Check Twilio credentials in .env")
        print("• Verify phone number is correct")
        print("• Check Twilio console for errors")

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("📧 Email & SMS Notification Test")
    print("=" * 50)
    
    test_email()
    test_sms()
    
    print("\n" + "=" * 50)
    print("✅ Test complete!")
    print("=" * 50 + "\n")
