#!/usr/bin/env python3
"""List all users in the database"""
import asyncio
from sqlalchemy import select
from database import SessionLocal
from models.user import User

async def list_users():
    async with SessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        if not users:
            print("❌ No users found in database")
            return
        
        print(f"\n✅ Found {len(users)} user(s):\n")
        for i, user in enumerate(users, 1):
            print(f"{i}. User ID: {user.id}")
            print(f"   Email: {user.email or '(none)'}")
            print(f"   Phone: {user.phone or '(none)'}")
            print(f"   Role: {user.role}")
            print(f"   Created: {user.created_at}")
            print()

if __name__ == "__main__":
    asyncio.run(list_users())
