#!/usr/bin/env python3
"""Change a user's role"""
import asyncio
from sqlalchemy import select
from database import SessionLocal
from models.user import User, UserRole

async def change_role():
    phone = "+918523060395"
    
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User not found")
            return
        
        print(f"\n📋 Current user:")
        print(f"   Email: {user.email}")
        print(f"   Phone: {user.phone}")
        print(f"   Current Role: {user.role}")
        
        print(f"\n🔄 Changing role to: platform_admin")
        user.role = UserRole.platform_admin
        
        await db.commit()
        await db.refresh(user)
        
        print(f"✅ Role changed!")
        print(f"   New Role: {user.role}")
        print(f"\n📱 Now login with phone {phone} and you'll have admin access!")

if __name__ == "__main__":
    asyncio.run(change_role())
