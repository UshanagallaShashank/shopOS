# How to Run ShopOS Locally (Supabase)

No Docker. No pipeline. Just Supabase + Python + Node.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign in → **New project**
2. Give it a name: `shopos`
3. Set a strong database password — **save it, you'll need it**
4. Region: `Southeast Asia (Singapore)` — closest to India
5. Wait ~2 minutes for it to provision

---

## Step 2 — Get your connection string

In Supabase dashboard:

**Project Settings → Database → Connection string → URI**

Copy the string. It looks like:
```
postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgreš
```

Change `postgresql://` to `postgresql+asyncpg://` — that's your `DATABASE_URL`.

```
postgresql+asyncpg://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## Step 3 — Run the SQL in Supabase

In the Supabase dashboard: **SQL Editor → New query** → paste the SQL below → click **Run**

```sql
-- Enums — must be created before the tables that use them
create type plan_type    as enum ('starter', 'pro', 'enterprise');
create type org_status   as enum ('active', 'suspended', 'maintenance');
create type user_role    as enum ('orgs_manager', 'platform_admin', 'org_admin', 'end_user');
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Orgs — one row per shop (create first, others reference it)
create table orgs (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        unique not null,
  name             text        not null,
  status           org_status  not null default 'active',
  plan             plan_type   not null default 'starter',
  razorpay_sub_id  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on orgs (slug);

-- Users — all roles live in one table
create table users (
  id           uuid       primary key default gen_random_uuid(),
  firebase_uid text       unique not null,
  email        text,
  phone        text,
  role         user_role  not null default 'end_user',
  org_id       uuid       references orgs(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on users (firebase_uid);
create index on users (org_id);

-- Products — always scoped to one org
create table products (
  id          uuid         primary key default gen_random_uuid(),
  org_id      uuid         not null references orgs(id),
  name        text         not null,
  description text,
  price       numeric(10,2) not null,
  stock       integer       not null default 0,
  category    text,
  is_active   boolean       not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);
create index on products (org_id);

-- Orders
create table orders (
  id                 uuid         primary key default gen_random_uuid(),
  org_id             uuid         not null references orgs(id),
  user_id            uuid         not null references users(id),
  status             order_status not null default 'pending',
  total              numeric(10,2) not null,
  razorpay_order_id  text,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now()
);
create index on orders (org_id);

-- Order items — line items inside one order
create table order_items (
  id                 uuid         primary key default gen_random_uuid(),
  order_id           uuid         not null references orders(id),
  product_id         uuid         not null references products(id),
  quantity           integer      not null,
  price_at_purchase  numeric(10,2) not null,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now()
);
```

You should see `Success. No rows returned` — that means all tables were created.

Verify in **Table Editor** — you should see: `orgs`, `users`, `products`, `orders`, `order_items`.

---

## Step 4 — Set up the Python backend

```bash
cd services/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Mac/Linux
# .venv\Scripts\activate         # Windows

# Install packages
pip install -r requirements.txt

# Create your env file
cp .env.example .env.local
```

Open `.env.local` and set your values:

```bash
# Paste the connection string from Step 2
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Leave these as-is for now
REDIS_URL=redis://localhost:6379
FIREBASE_PROJECT_ID=
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

> `DEBUG=true` makes FastAPI log every SQL query — useful while learning.

---

## Step 5 — Start the backend

```bash
# Make sure you're in services/api with .venv active
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Open `http://localhost:8000/health` → should return `{"status":"ok"}`

Open `http://localhost:8000/docs` → interactive API explorer (test every endpoint here)

---

## Step 6 — Start the frontend

Open a new terminal tab:

```bash
cd apps/platform-admin

# Copy env file
cp .env.local.example .env.local

# Install and run
npm install
npm run dev
```

Open `http://localhost:3000` — you should land on the dashboard.

---

## Quick test — create your first org

In the browser at `http://localhost:3000/orgs/new`:
- Name: `Meena Boutique`
- Slug: auto-fills as `meena-boutique`
- Plan: `Starter`
- Click **Create Org**

Or via curl:
```bash
curl -X POST http://localhost:8000/orgs/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Meena Boutique", "slug": "meena-boutique", "plan": "starter"}'
```

Check Supabase **Table Editor → orgs** — the row should appear there instantly.

---

## What each URL does

| URL | What |
|-----|------|
| `http://localhost:8000/docs` | FastAPI Swagger — test every endpoint |
| `http://localhost:8000/health` | API alive check |
| `http://localhost:8000/health/db` | DB connected check |
| `http://localhost:3000/dashboard` | Stats overview |
| `http://localhost:3000/orgs` | All shops |
| `http://localhost:3000/orgs/new` | Create a shop |
| `http://localhost:3000/orgs/[id]` | Shop detail + products |

---

## Troubleshooting

**`connection refused` on the DB:**
- Double-check the connection string — password must be URL-encoded if it has special chars (replace `@` with `%40`)
- In Supabase: Project Settings → Database → make sure the project is not paused (free tier pauses after 1 week of inactivity)

**`relation does not exist` error:**
- The SQL from Step 3 didn't run — go back to Supabase SQL Editor and run it again

**CORS error in browser:**
- Make sure `.env.local` in `services/api` has `ALLOWED_ORIGINS=["http://localhost:3000"]`
- Restart the uvicorn server after editing `.env.local`

**`ModuleNotFoundError`:**
- You're running Python outside the venv — run `source .venv/bin/activate` first
