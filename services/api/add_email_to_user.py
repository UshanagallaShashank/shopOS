#!/usr/bin/env python3
"""
Add email/password to an existing phone-only user
Usage: python add_email_to_user.py
"""
import asyncio
from sqlalchemy import select
from database import SessionLocal
from models.user import User

async def add_email_to_phone_user():
    """Add email to a user who only has phone number"""
    
    # Get the phone number
    phone = input("Enter the phone number (e.g., +919876543210): ").strip()
    
    async with SessionLocal() as db:
        # Find user by phone
        result = await db.execute(
            select(User).where(User.phone == phone)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ No user found with phone: {phone}")
            return
        
        print(f"\n✅ Found user:")
        print(f"   ID: {user.id}")
        print(f"   Phone: {user.phone}")
        print(f"   Email: {user.email or '(none)'}")
        print(f"   Role: {user.role}")
        print(f"   Firebase UID: {user.firebase_uid}")
        
        # Check if user already has email
        if user.email:
            print(f"\n⚠️  User already has email: {user.email}")
            print("   You can login with email/password using this email.")
            return
        
        print("\n📧 This user doesn't have an email yet.")
        print("   To login with email/password, you need to:")
        print("   1. Add email to Supabase Auth user")
        print("   2. Set a password in Supabase")
        print("   3. Update email in ShopOS database")
        print("\n   This requires Supabase admin access.")
        print("   Easier solution: Use phone OTP by configuring Twilio!")

if __name__ == "__main__":
    asyncio.run(add_email_to_phone_user())
