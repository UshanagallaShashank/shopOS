#!/usr/bin/env python3
"""
Check which user is associated with a Supabase UID
"""
import asyncio
import sys
from sqlalchemy import select
from database import SessionLocal
from models.user import User

async def check_user_by_firebase_uid(firebase_uid: str):
    async with SessionLocal() as db:
        result = await db.execute(
            select(User).where(User.firebase_uid == firebase_uid)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ No user found with firebase_uid: {firebase_uid}")
            return
        
        print(f"\n✅ Found user:")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email or '(none)'}")
        print(f"   Phone: {user.phone or '(none)'}")
        print(f"   Role: {user.role}")
        print(f"   Firebase UID: {user.firebase_uid}")
        print(f"   Created: {user.created_at}")

async def list_phone_users(phone: str):
    async with SessionLocal() as db:
        result = await db.execute(
            select(User).where(User.phone == phone)
        )
        users = result.scalars().all()
        
        if not users:
            print(f"❌ No users found with phone: {phone}")
            return
        
        print(f"\n✅ Found {len(users)} user(s) with phone {phone}:\n")
        for i, user in enumerate(users, 1):
            print(f"{i}. User ID: {user.id}")
            print(f"   Email: {user.email or '(none)'}")
            print(f"   Phone: {user.phone}")
            print(f"   Role: {user.role}")
            print(f"   Firebase UID: {user.firebase_uid}")
            print(f"   Created: {user.created_at}")
            print()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1].startswith("+"):
            # Phone number
            asyncio.run(list_phone_users(sys.argv[1]))
        else:
            # Firebase UID
            asyncio.run(check_user_by_firebase_uid(sys.argv[1]))
    else:
        print("Usage:")
        print("  python check_current_user.py +918523060395  # Check by phone")
        print("  python check_current_user.py <firebase_uid>  # Check by UID")
