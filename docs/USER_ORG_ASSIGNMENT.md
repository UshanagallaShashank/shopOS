# User-Org Assignment Guide

## Overview
Users can be assigned to organizations in multiple ways depending on their role and the environment.

## For Local Development

### Method 1: Platform Admin Assignment (Recommended for Testing)
1. **Login as platform_admin**
2. **Navigate to Users page** (`/users`)
3. **Click Edit** on any user
4. **Select an org** from the dropdown
5. **Save changes**

### Method 2: Org Manager Assignment
1. **Login as orgs_manager**
2. **Go to specific org detail page** (`/orgs/{org-id}`)
3. **Click Users tab**
4. **Use "Assign user to this org" dropdown**
5. **Select user and click Assign**

### Method 3: Direct Database Update (Quick Testing)
```sql
-- Update user's org_id directly
UPDATE users 
SET org_id = 'your-org-uuid-here', 
    role = 'org_admin'  -- or 'end_user'
WHERE email = 'user@example.com';
```

## For Production

### Method 1: Org Request Flow (Primary)
1. **End user** submits org creation request via `/request-org`
2. **Platform admin** reviews and approves at `/admin/org-requests`
3. **System automatically**:
   - Creates the org
   - Assigns user as `org_admin`
   - Links user to the new org

### Method 2: Invite Code System (Coming Soon)
1. **Org admin/manager** generates invite code for their org
2. **New user** enters code during signup
3. **System automatically** assigns user to that org

### Method 3: Admin Assignment
- Platform admin or orgs_manager can manually assign users to orgs via Users page

## Multi-Org Support (Future)

Currently, users can belong to **one org at a time**. Future enhancements will support:

1. **URL-based org switching**: `{org-slug}.shopos.in` determines active org
2. **User-org junction table**: Many-to-many relationship
3. **Org switcher UI**: Dropdown to switch between orgs user belongs to
4. **Role per org**: User can be `org_admin` in one org, `end_user` in another

### Planned Schema Changes
```sql
-- Future: user_orgs junction table
CREATE TABLE user_orgs (
    user_id UUID REFERENCES users(id),
    org_id UUID REFERENCES orgs(id),
    role VARCHAR(50),  -- role within this specific org
    PRIMARY KEY (user_id, org_id)
);
```

## Role Hierarchy

### platform_admin
- Can assign any user to any org
- Can change any user's role
- Full system access

### orgs_manager
- Can assign users to any org
- Cannot promote to platform_admin
- Manages all orgs

### org_admin
- Can only view users in their own org
- Cannot assign users (yet - future feature)
- Manages their org's products/orders

### end_user
- Cannot assign users
- Can request org creation
- Can view their own orders

## Quick Test Scenarios

### Scenario 1: Create Org Admin
```bash
# 1. User signs up as end_user
# 2. User submits org request at /request-org
# 3. Platform admin approves at /admin/org-requests
# 4. User is now org_admin of new org
```

### Scenario 2: Add User to Existing Org
```bash
# 1. Platform admin goes to /users
# 2. Clicks Edit on user
# 3. Selects org from dropdown
# 4. User is now assigned to that org
```

### Scenario 3: Bulk User Assignment (SQL)
```sql
-- Assign multiple users to same org
UPDATE users 
SET org_id = 'org-uuid-here'
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com');
```

## Common Issues

### User can't see org data
- **Check**: User's `org_id` matches the org they're trying to access
- **Fix**: Update user's org_id via Users page or SQL

### User has wrong permissions
- **Check**: User's `role` field
- **Fix**: Update role via Users page (Edit button)

### Org admin can't manage products
- **Check**: User's role is `org_admin` AND `org_id` is set
- **Fix**: Ensure both fields are correct

## API Endpoints

### Assign User to Org
```bash
PATCH /users/{user_id}
{
  "org_id": "org-uuid-here"
}
```

### Remove User from Org
```bash
PATCH /users/{user_id}
{
  "clear_org": true
}
```

### List Users in Org
```bash
GET /users/?org_id=org-uuid-here
```
