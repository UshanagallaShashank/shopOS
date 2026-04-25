#!/usr/bin/env python3
"""
Quick setup checker for the API server.
Run this to verify all dependencies and configuration are correct.
"""

import sys

def check_imports():
    """Check if all required packages are installed"""
    print("Checking Python packages...")
    required = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("sqlalchemy", "SQLAlchemy"),
        ("jwt", "PyJWT"),
        ("cryptography", "Cryptography"),
        ("httpx", "HTTPX"),
        ("supabase", "Supabase"),
    ]
    
    missing = []
    for module, name in required:
        try:
            __import__(module)
            print(f"  ✓ {name}")
        except ImportError:
            print(f"  ✗ {name} - MISSING")
            missing.append(name)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All packages installed\n")
    return True


def check_env():
    """Check if environment variables are set"""
    print("Checking environment variables...")
    
    try:
        from config import settings
        
        checks = [
            ("SUPABASE_URL", settings.supabase_url, "https://"),
            ("SUPABASE_ANON_KEY", settings.supabase_anon_key, "eyJ"),
            ("SUPABASE_SERVICE_KEY", settings.supabase_service_key, "eyJ"),
            ("SUPABASE_JWT_SECRET", settings.supabase_jwt_secret, ""),
            ("DATABASE_URL", settings.database_url, "postgresql"),
        ]
        
        missing = []
        for name, value, prefix in checks:
            if not value or value == "":
                print(f"  ✗ {name} - NOT SET")
                missing.append(name)
            elif prefix and not value.startswith(prefix):
                print(f"  ⚠ {name} - SET (but might be incorrect)")
            else:
                print(f"  ✓ {name}")
        
        if missing:
            print(f"\n❌ Missing environment variables: {', '.join(missing)}")
            print("Check your .env file")
            return False
        
        print("\n✅ All environment variables set\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading config: {e}\n")
        return False


def check_jwt():
    """Check if JWT verification works"""
    print("Checking JWT verification...")
    
    try:
        from utils.jwt_verify import verify_supabase_token
        print("  ✓ JWT verification utility loaded")
        print("\n✅ JWT verification ready\n")
        return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        print("\n❌ JWT verification not working\n")
        return False


def main():
    print("=" * 50)
    print("ShopOS API Setup Checker")
    print("=" * 50)
    print()
    
    checks = [
        check_imports(),
        check_env(),
        check_jwt(),
    ]
    
    print("=" * 50)
    if all(checks):
        print("✅ ALL CHECKS PASSED")
        print("\nYou can now start the server:")
        print("  uvicorn main:app --reload")
    else:
        print("❌ SOME CHECKS FAILED")
        print("\nFix the issues above before starting the server")
        sys.exit(1)
    print("=" * 50)


if __name__ == "__main__":
    main()
