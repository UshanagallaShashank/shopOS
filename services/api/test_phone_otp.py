#!/usr/bin/env python3
"""
Test phone OTP configuration
Run this after configuring Twilio in Supabase
"""
import requests
import sys

API_URL = "http://localhost:8000"

def test_send_otp(phone: str):
    """Test sending OTP to a phone number"""
    print(f"\n🧪 Testing Phone OTP for: {phone}")
    print("=" * 50)
    
    # Test send OTP
    print("\n1️⃣  Sending OTP...")
    response = requests.post(
        f"{API_URL}/auth/phone/send-otp",
        json={"phone": phone}
    )
    
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! OTP sent successfully!")
        print("\n📱 Check your phone for the SMS")
        print("\nNext steps:")
        print("1. Check your phone for the 6-digit code")
        print("2. Go to: http://localhost:3000/login")
        print("3. Click 'Phone OTP' tab")
        print("4. Enter your phone number")
        print("5. Enter the code you received")
        print("6. Click 'Verify & Sign in'")
        return True
    else:
        print("\n❌ FAILED! OTP not sent")
        print("\nPossible issues:")
        
        error_detail = response.json().get("detail", "")
        
        if "Invalid From Number" in error_detail:
            print("• Phone number not added to Twilio Messaging Service")
            print("• Fix: Add phone number to Sender Pool in Twilio Console")
        elif "Twilio credentials" in error_detail:
            print("• Invalid Twilio credentials")
            print("• Fix: Check Account SID and Auth Token in Supabase")
        elif "Unsupported phone provider" in error_detail:
            print("• Phone provider not enabled in Supabase")
            print("• Fix: Enable Phone provider in Supabase Dashboard")
        else:
            print(f"• Error: {error_detail}")
        
        print("\n📖 See FIX_PHONE_OTP_NOW.md for detailed setup guide")
        return False

def main():
    print("\n" + "=" * 50)
    print("🔐 Phone OTP Configuration Test")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code != 200:
            print("\n❌ Backend server is not responding")
            print("   Start it with: cd services/api && make dev")
            sys.exit(1)
        print("\n✅ Backend server is running")
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend server")
        print("   Start it with: cd services/api && make dev")
        sys.exit(1)
    
    # Get phone number
    if len(sys.argv) > 1:
        phone = sys.argv[1]
    else:
        phone = input("\nEnter phone number to test (e.g., +918523060395): ").strip()
    
    # Test OTP
    success = test_send_otp(phone)
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Phone OTP is configured correctly!")
    else:
        print("❌ Phone OTP needs configuration")
        print("\n📖 Follow the guide: FIX_PHONE_OTP_NOW.md")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
