#!/usr/bin/env python3
"""
Fix missing request_status enum type in database.
Run this script to create the enum type if it doesn't exist.
"""
import asyncio
import asyncpg
from config import settings


async def fix_enum():
    """Create the request_status enum type if it doesn't exist."""
    # Extract connection params from DATABASE_URL
    # Format: postgresql+asyncpg://user:pass@host:port/dbname
    url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print(f"Connecting to database...")
    print(f"URL: {url[:50]}...")  # Print first 50 chars for debugging
    conn = await asyncpg.connect(url)
    
    try:
        # Create the enum type
        print("Creating request_status enum type...")
        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
                RAISE NOTICE 'Created request_status enum type';
            EXCEPTION
                WHEN duplicate_object THEN 
                    RAISE NOTICE 'request_status enum type already exists';
            END $$;
        """)
        
        # Check if org_requests table exists and needs column type conversion
        print("Checking org_requests table...")
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'org_requests'
            );
        """)
        
        if table_exists:
            print("Table exists, checking status column type...")
            column_type = await conn.fetchval("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'org_requests' 
                AND column_name = 'status';
            """)
            
            if column_type == 'character varying':
                print("Converting status column from VARCHAR to request_status enum...")
                # Step 1: Drop the default
                await conn.execute("""
                    ALTER TABLE org_requests 
                    ALTER COLUMN status DROP DEFAULT;
                """)
                # Step 2: Convert the column type
                await conn.execute("""
                    ALTER TABLE org_requests 
                    ALTER COLUMN status TYPE request_status 
                    USING status::request_status;
                """)
                # Step 3: Add the default back
                await conn.execute("""
                    ALTER TABLE org_requests 
                    ALTER COLUMN status SET DEFAULT 'pending'::request_status;
                """)
                print("✓ Column converted successfully")
            elif column_type == 'USER-DEFINED':
                print("✓ Column already uses request_status enum")
            else:
                print(f"⚠ Unexpected column type: {column_type}")
        else:
            print("✓ Table doesn't exist yet (will be created on first run)")
        
        # Verify enum values
        print("\nVerifying enum values...")
        enum_values = await conn.fetch("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = 'request_status'::regtype
            ORDER BY enumsortorder;
        """)
        
        print("✓ request_status enum values:")
        for row in enum_values:
            print(f"  - {row['enumlabel']}")
        
        print("\n✅ Database fix completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(fix_enum())
