# 🏪 ShopOS

**White-label e-commerce SaaS for India's small shops.**  
Every shop gets their own branded storefront, auto-deployed, AI-powered, live at `shopname.shopOS.in` in under 3 minutes.

---

## What is ShopOS?

ShopOS is a multi-tenant SaaS platform where small shop owners (boutiques, groceries, electronics, restaurants) get a complete e-commerce store without touching code. You run the platform. They run their business. AI handles the boring parts.

```
You (orgs_manager)
  └── Platform admins
        └── Org admins (Meena Boutique, Ravi Groceries, ...)
              └── End users / customers
```

---

## Product Name & Branding

| Asset | Value |
|-------|-------|
| **Product name** | ShopOS |
| **Tagline** | *Your shop. Your brand. Online in minutes.* |
| **Domain** | `shopOS.in` |
| **Storefront URLs** | `{slug}.shopOS.in` — auto-generated on org creation |
| **Primary color** | `#1A1A2E` (deep navy) + `#E94560` (electric red) accent |
| **Logo concept** | Stylised "S" inside a rounded square — like an OS icon. Conveys "operating system for shops". |
| **Font pairing** | Display: `Instrument Serif` · Body: `DM Sans` · Mono: `JetBrains Mono` |
| **Brand voice** | Direct, no-jargon, confidence. "Your store is live." not "Congratulations on completing onboarding." |

---

## Where AI Is Used

AI runs silently in the background — neither the shop owner nor the customer needs to know it's there.

| # | Feature | What happens | Model |
|---|---------|-------------|-------|
| 1 | **Product description writer** | Owner uploads a photo → AI reads the image and writes "Beautiful floral silk kurta with embroidery on neckline, perfect for festive occasions" automatically | Gemini 1.5 Flash |
| 2 | **Smart search** | Customer types "something red for wedding" → AI understands meaning, returns relevant sarees/lehengas even if those words aren't in the product name | pgvector + embeddings |
| 3 | **Auto tags + categories** | Product is added → AI decides category and tags like "ethnic", "cotton", "summer" without owner doing anything | Gemini 1.5 Flash |
| 4 | **Image quality check** | Owner uploads a blurry/dark photo → AI rejects it instantly before it goes live, asks for a better one | Vertex AI Vision |
| 5 | **Fraud detection** | Someone places 10 orders in 5 minutes → AI flags it, holds the order, explains WHY it's suspicious | LangGraph + Claude 3 Haiku |
| 6 | **Support chat** | Org admin types "how do I add a discount?" → Claude answers instantly, 24/7, no human needed on our side | Claude 3.5 Sonnet |
| 7 | **Review summarization** | 50 customer reviews → AI compresses them into 5 bullet points for the org admin dashboard | Claude 3 Haiku |

> All AI calls are traced via **LangSmith** — every prompt, response, latency, and cost is logged for debugging and optimization.

---

## 4-Tier Hierarchy

| Role | Who | What they can do |
|------|-----|-----------------|
| `orgs_manager` | You | Create/delete orgs, manage billing plans, platform-level analytics, access everything |
| `platform_admin` | Your team | Build templates, handle custom design requests, suspend orgs, read-only billing |
| `org_admin` | Shop owner (Meena, Ravi, Kumar) | Manage their own store — products, theme, payments, customers, snapshots |
| `end_user` | Customer on Meena's storefront | Browse, search, cart, checkout, optional VIP subscription |

---

## Full Tech Stack

### Frontend

#### Platform + Org Admin Dashboards
```
Next.js 14          # App Router, TypeScript, Server Components
Tailwind CSS 3.4    # Utility-first, JIT compiler
shadcn/ui           # Radix UI primitives + Tailwind — NOT deprecated, actively maintained
                    # Components: Dialog, Sheet, Popover, Command (cmdk), DataTable
Framer Motion 11    # Page transitions, micro-interactions, drag animations
React Query v5      # (TanStack Query) — server state, caching, optimistic updates
Zustand 4           # Lightweight client state (NO Redux)
React Hook Form v7  # Form management + Zod validation
Zod 3               # Schema validation — shared between FE and BE
@dnd-kit/core       # Drag-and-drop — image reordering, product grid sorting
                    # Modern, accessible, replaces react-beautiful-dnd (deprecated)
Recharts 2          # Charts for analytics dashboards — built on D3, tree-shakeable
react-dropzone      # File upload drop zones — hooks-based, maintained
react-hot-toast     # Toast notifications — tiny, beautiful
nuqs                # URL state management (replaces query-string)
date-fns 3          # Date formatting — tree-shakeable, replaces moment.js
```

#### Storefront (per org)
```
Next.js 14          # output: 'export' — static PWA, containerized per org
Tailwind CSS 3.4    # Design tokens injected per org at build time
next-pwa            # Service worker, offline support, "Add to home screen"
Framer Motion 11    # Product image transitions, cart animations
embla-carousel      # Lightweight product image carousel — no jQuery dependency
@radix-ui/react-*   # Accessible primitives — Dialog (quick view), Select (variants)
```

### Backend

```
Python 3.12
FastAPI 0.111        # Async-first, automatic OpenAPI docs, type-safe
Pydantic v2          # 5-10x faster than v1, model validation + serialization
SQLAlchemy 2.0       # Async ORM — fully typed, NOT the old 1.x syntax
Alembic              # Database migrations
asyncpg              # Async PostgreSQL driver
redis.asyncio        # Async Redis client
ARQ                  # Async job queue on Redis (replaces Celery for Python async)
httpx                # Async HTTP client (replaces requests)
python-jose[cryptography]  # JWT handling
passlib[bcrypt]      # Password hashing
python-multipart     # File upload handling
Pillow               # Server-side image processing before S3
```

### AI Layer

```
# Vertex AI (Google — stays within GCP billing)
google-cloud-aiplatform  # Vertex AI SDK
vertexai                 # Gemini 1.5 Flash — product descriptions, category tagging
                         # Gemini 1.5 Pro — complex reasoning (fraud detection)
                         # Imagen 3 — product background removal (optional)

# LangChain + LangGraph (orchestration layer)
langchain 0.3            # NOT 0.1/0.2 — fully async, LCEL (LangChain Expression Language)
langchain-google-vertexai # Vertex AI integration for LangChain
langchain-anthropic       # Claude integration for LangChain
langchain-community       # Community tools
langgraph 0.1            # Agent orchestration — state machines for multi-step AI flows
langsmith               # LangChain observability — trace every AI call

# Anthropic (Claude API)
anthropic 0.26          # Claude 3.5 Sonnet — org support chat, review summarization
                        # Claude 3 Haiku — fast fraud flag classification

# Vector Search
pgvector                # PostgreSQL extension — semantic product search
langchain-postgres      # PGVector store via LangChain
sentence-transformers   # Local embedding fallback
```

#### How LangChain/LangGraph is used

```python
# Example: AI product description chain (LCEL syntax)
from langchain_google_vertexai import ChatVertexAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatVertexAI(model_name="gemini-1.5-flash", temperature=0.7)

chain = (
    ChatPromptTemplate.from_template(
        "You are a product copywriter for an Indian e-commerce store. "
        "Write a 2-sentence product description for: {product_name}. "
        "Category: {category}. Tone: warm, confident, no fluff."
    )
    | llm
    | StrOutputParser()
)

# Streaming response
async for chunk in chain.astream({"product_name": "Floral Silk Kurta", "category": "Women's Ethnic Wear"}):
    yield chunk
```

```python
# Example: LangGraph agent for fraud detection
from langgraph.graph import StateGraph, END
from typing import TypedDict

class FraudState(TypedDict):
    order: dict
    risk_score: float
    flags: list[str]
    decision: str

def check_velocity(state: FraudState) -> FraudState:
    # Check if same user placed 5+ orders in 1 hour
    ...

def check_address(state: FraudState) -> FraudState:
    # Validate delivery address with Google Maps
    ...

def claude_reasoning(state: FraudState) -> FraudState:
    # Claude 3 Haiku explains WHY it's flagging
    ...

graph = StateGraph(FraudState)
graph.add_node("velocity", check_velocity)
graph.add_node("address", check_address)
graph.add_node("reasoning", claude_reasoning)
graph.add_edge("velocity", "address")
graph.add_edge("address", "reasoning")
graph.add_edge("reasoning", END)
fraud_agent = graph.compile()
```

### Database

```
PostgreSQL 15          # Cloud SQL (asia-south1)
  - pgvector extension # Semantic product search
  - Row-Level Security # Tenant isolation — every table has org_id RLS policy
  - pg_trgm            # Fast LIKE search for product names

Redis 7                # Memorystore (asia-south1)
  - Sessions           # Firebase token → user session cache (TTL 1hr)
  - Rate limiting      # Sliding window per org per endpoint
  - ARQ job queue      # Background jobs (image processing, AI calls)
  - Pub/Sub            # org.created event → triggers Cloud Build
```

### Infrastructure — GCP `asia-south1` (Mumbai)

```
Cloud Run            # Backend API + per-org storefronts (containerized)
Cloud Build          # CI/CD — your code + auto-deploy org storefronts
Cloud SQL            # Managed PostgreSQL
Memorystore          # Managed Redis
Cloud Storage        # Product images, logos, store snapshots
Cloud CDN            # Edge caching for images — POP in Mumbai
Firebase Hosting     # Platform + org admin dashboards (global CDN)
Firebase Auth        # Phone OTP + Google OAuth — DPDP Act compliant
Cloud DNS            # *.shopOS.in wildcard → Cloud Load Balancer
Cloud Load Balancer  # SSL termination + subdomain routing
Cloud Armor          # DDoS protection, IP allowlisting
Pub/Sub              # Event bus — org.created, store.published, payment.failed
Cloud Scheduler      # Cron — payment reconciliation (5min), snapshot cleanup (daily)
Artifact Registry    # Docker images for storefronts
Cloud Monitoring     # Metrics + uptime checks on every storefront URL
Secret Manager       # API keys, DB passwords — NEVER in env vars or code
```

### Payments

```
Razorpay Route       # Split payments — org gets revenue, you auto-deduct platform fee
Razorpay Subscriptions  # Platform sub (org→you) + VIP sub (customer→org)
                        # Both managed via single Razorpay account with linked accounts
```

---

## Project Structure

```
shopos/
├── apps/
│   ├── platform-admin/          # Next.js — orgs_manager + platform_admin UI
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── orgs/
│   │   │   ├── subscriptions/
│   │   │   ├── templates/
│   │   │   └── pipeline/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── data-table/      # TanStack Table v8 + shadcn
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   └── dnd/             # @dnd-kit drag components
│   │   └── lib/
│   │       ├── api.ts           # React Query + httpx client
│   │       └── store.ts         # Zustand stores
│   │
│   ├── org-admin/               # Next.js — per-org admin dashboard
│   │   ├── app/
│   │   │   ├── products/
│   │   │   ├── media/           # Drag-drop upload + AI processing
│   │   │   ├── theme/           # Theme editor + snapshot history
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   └── payments/
│   │   └── components/
│   │       ├── media-library/   # react-dropzone + @dnd-kit image grid
│   │       ├── snapshot-viewer/ # Visual snapshot history
│   │       └── ai-writer/       # Claude/Gemini product description UI
│   │
│   └── storefront-template/     # Next.js template — cloned per org at deploy
│       ├── app/
│       │   ├── page.tsx         # Homepage
│       │   ├── products/
│       │   ├── cart/
│       │   └── account/
│       ├── lib/
│       │   ├── theme.ts         # Reads ORG_THEME_TOKENS env var
│       │   └── search.ts        # pgvector semantic search
│       └── public/
│           └── manifest.json    # PWA manifest
│
├── services/
│   ├── api/                     # FastAPI backend
│   │   ├── routers/
│   │   │   ├── orgs.py
│   │   │   ├── products.py
│   │   │   ├── media.py
│   │   │   ├── orders.py
│   │   │   ├── payments.py
│   │   │   ├── subscriptions.py
│   │   │   └── ai.py
│   │   ├── models/              # SQLAlchemy 2.0 models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── middleware/
│   │   │   ├── auth.py          # Firebase JWT → org_id resolver
│   │   │   └── rls.py           # PostgreSQL RLS context setter
│   │   └── workers/             # ARQ job definitions
│   │       ├── image_processor.py   # Resize variants + WEBP conversion
│   │       ├── ai_description.py    # Gemini Flash product description
│   │       └── payment_reconcile.py # Razorpay ledger reconciliation
│   │
│   └── ai/                      # LangChain/LangGraph agents
│       ├── chains/
│       │   ├── product_desc.py  # LCEL chain — Gemini description generation
│       │   ├── search_embed.py  # pgvector embedding + retrieval chain
│       │   └── review_summary.py # Claude review summarization chain
│       ├── agents/
│       │   ├── fraud_agent.py   # LangGraph — multi-step fraud detection
│       │   └── support_agent.py # LangGraph — org admin support chatbot
│       └── tools/
│           ├── order_lookup.py  # Tool: fetch order details
│           └── policy_lookup.py # Tool: retrieve platform policies
│
├── infra/
│   ├── cloudbuild.yaml          # Platform CI/CD pipeline
│   ├── storefront-deploy.yaml   # Per-org storefront deploy trigger
│   ├── terraform/               # GCP resource definitions
│   │   ├── main.tf
│   │   ├── cloud_run.tf
│   │   ├── cloud_sql.tf
│   │   ├── redis.tf
│   │   ├── dns.tf
│   │   └── iam.tf
│   └── k8s/                     # (future scaling) GKE configs
│
├── packages/
│   ├── ui/                      # Shared component library (shadcn base)
│   ├── types/                   # Shared TypeScript types (from Zod schemas)
│   └── config/                  # Shared ESLint, Prettier, Tailwind config
│
└── docs/
    ├── api/                     # Auto-generated from FastAPI OpenAPI
    ├── architecture/
    └── runbooks/
```

---

## Library Decisions — Why These, Not Those

### UI Components

| Use | Not | Reason |
|-----|-----|--------|
| `shadcn/ui` | Material UI, Chakra UI | shadcn is copy-owned (no version lock), built on Radix (accessible), Tailwind-native. MUI is React 18 problematic. Chakra v3 broke APIs. |
| `@dnd-kit/core` | `react-beautiful-dnd` | react-beautiful-dnd is **archived/unmaintained** since 2023. @dnd-kit is the modern replacement — accessible, pointer+touch+keyboard. |
| `TanStack Table v8` | `react-table v7` | react-table v7 is old. TanStack Table is the same author, fully rewritten, headless, TypeScript-first. |
| `Framer Motion 11` | `react-spring`, CSS only | Framer Motion has the best API for layout animations and shared element transitions. v11 is fully async. |
| `nuqs` | `next/navigation` + manual | nuqs handles URL search params as React state — perfect for filters, pagination state in URLs. |
| `embla-carousel` | `swiper`, `slick` | Swiper is 180KB. Embla is 3KB. No jQuery. Works with Framer Motion. |
| `react-hot-toast` | `react-toastify` | Toastify is heavier. react-hot-toast is 5KB, beautiful defaults, Tailwind-friendly. |

### State Management

| Use | Not | Reason |
|-----|-----|--------|
| `TanStack Query v5` | Redux Toolkit, SWR | Server state belongs in TanStack Query. Redux for server state is 2019 thinking. SWR lacks the full feature set. |
| `Zustand 4` | Jotai, Recoil | Zustand is minimal, no providers, DevTools support, persists easily. Jotai is fine but Zustand has better DX for this use case. Recoil is Meta-internal and stagnating. |

### Forms + Validation

| Use | Not | Reason |
|-----|-----|--------|
| `React Hook Form v7` + `Zod` | Formik | Formik is noticeably slower on re-renders. RHF is ~25KB, uncontrolled by default. Zod schemas can be shared between FE and FastAPI (via `zod-to-json-schema` → Pydantic). |

### AI / LangChain

| Use | Not | Reason |
|-----|-----|--------|
| `LangChain 0.3` (LCEL) | LangChain 0.1/0.2 | LangChain 0.1 chains (`LLMChain`) are deprecated. LCEL (pipe syntax) is the current standard — composable, streaming-native, fully async. |
| `LangGraph 0.1` | Custom agent loops | LangGraph gives you typed state machines for agents — retries, branching, human-in-the-loop. Far better than manual while loops. |
| `LangSmith` | Custom logging | LangSmith traces every LLM call with inputs/outputs/latency. Essential for debugging AI flows in production. |
| `Vertex AI` | OpenAI | Stay in GCP ecosystem — unified billing, same region as database, no data leaving India for DPDP compliance. |
| `Claude API` | GPT-4 for support chat | Claude's context handling and instruction following is genuinely better for multi-turn support conversations. You already have it at RealPage. |

### Backend

| Use | Not | Reason |
|-----|-----|--------|
| `SQLAlchemy 2.0 async` | SQLAlchemy 1.x | 1.x sync patterns block the event loop in FastAPI. 2.0 has fully async session handling. |
| `ARQ` | Celery | Celery with async Python is painful. ARQ is built for asyncio — same event loop as FastAPI. |
| `asyncpg` | psycopg2 | psycopg2 is synchronous. asyncpg is the fastest async PostgreSQL driver for Python. |
| `httpx` | requests | requests is synchronous. httpx is the async-native replacement with identical API. |

---

## AI Integration Map

```
Feature                    Model                  Trigger               Output
─────────────────────────────────────────────────────────────────────────────────
Product description gen    Gemini 1.5 Flash       Image upload          2-sentence desc
Product category tagging   Gemini 1.5 Flash       Product create/edit   Tags array
Image quality check        Vertex AI Vision       Image upload          Pass/fail + reason
Storefront search          pgvector + embeddings  Customer search query Ranked products
Fraud detection            LangGraph + Claude 3   Order placed          Risk score + flags
Support chat               Claude 3.5 Sonnet      Org admin opens chat  Conversational help
Review summarization       Claude 3 Haiku         Admin requests        Bullet summary
Bulk description regen     Gemini 1.5 Flash       Admin triggers        All products updated
```

### LangSmith Traces

Every AI call is traced in LangSmith with:
- Input prompt (template + variables)
- Model used + temperature
- Output + tokens used
- Latency
- Cost estimate

Set `LANGCHAIN_TRACING_V2=true` and `LANGCHAIN_API_KEY` in Secret Manager. View at `smith.langchain.com`.

---

## Subscription Model

### Platform subscription (Org → You)

Managed via Razorpay Subscriptions. One plan per org, billed monthly. If payment fails → 3-day grace → storefront enters maintenance mode (browsable, no checkout). Auto-resumes when payment succeeds.

| Plan | Price | Products | Txn fee | AI desc/mo | Snapshots |
|------|-------|----------|---------|------------|-----------|
| Starter | ₹999 | 50 | 2% | 50 | 5 |
| Pro | ₹2,499 | 500 | 1.5% | Unlimited | 20 |
| Enterprise | ₹6,999 | Unlimited | 1% | Unlimited | Unlimited |

### Storefront VIP subscription (Customer → Org)

Org admin sets the price and perks. Razorpay Route handles split — org receives revenue, your platform fee auto-deducted. Managed via `subscriptions` table + Razorpay webhook.

---

## Auto-Deployment Pipeline

```yaml
# cloudbuild-storefront.yaml — triggered by Pub/Sub org.created event
steps:
  - name: 'gcr.io/cloud-builders/git'
    args: ['clone', 'https://github.com/your-org/storefront-template', '/workspace/store']

  - name: 'node:20-alpine'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        cd /workspace/store
        echo "ORG_ID=${_ORG_ID}" >> .env.production
        echo "ORG_SLUG=${_ORG_SLUG}" >> .env.production
        echo "THEME_TOKENS=${_THEME_TOKENS}" >> .env.production
        npm ci && npm run build

  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'asia-south1-docker.pkg.dev/${PROJECT_ID}/storefronts/${_ORG_SLUG}:latest', '/workspace/store']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'asia-south1-docker.pkg.dev/${PROJECT_ID}/storefronts/${_ORG_SLUG}:latest']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run', 'deploy', '${_ORG_SLUG}'
      - '--image', 'asia-south1-docker.pkg.dev/${PROJECT_ID}/storefronts/${_ORG_SLUG}:latest'
      - '--region', 'asia-south1'
      - '--platform', 'managed'
      - '--allow-unauthenticated'
      - '--min-instances', '1'

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'dns', 'record-sets', 'create'
      - '${_ORG_SLUG}.shopOS.in.'
      - '--zone', 'shopos-in'
      - '--type', 'CNAME'
      - '--ttl', '300'
      - '--rrdatas', 'ghs.googlehosted.com.'

substitutions:
  _ORG_ID: ''
  _ORG_SLUG: ''
  _THEME_TOKENS: ''

timeout: '600s'
```

**Total deploy time: ~2.5–4 minutes** from org creation to live URL.

---

## Database Schema (Key Tables)

```sql
-- Multi-tenancy: every table has org_id + RLS policy
-- RLS policy example:
CREATE POLICY org_isolation ON products
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Core tables
orgs (id, slug, name, status, plan, razorpay_sub_id, created_at)
users (id, firebase_uid, org_id, role, email, phone)
products (id, org_id, name, description, price, stock, category_id, status)
product_images (id, org_id, product_id, url, alt_text, ai_description, tags, variants_json)
categories (id, org_id, name, display_order, visible)
orders (id, org_id, user_id, status, total, razorpay_order_id)
order_items (id, order_id, product_id, quantity, price_at_purchase)
payment_ledger (id, org_id, order_id, amount, platform_fee, settled_amount, status, razorpay_payment_id)
store_snapshots (id, org_id, theme_tokens_json, screenshot_url, created_at)
-- Max 20 snapshots per org — oldest auto-deleted by Cloud Scheduler
customer_subscriptions (id, org_id, user_id, razorpay_sub_id, status, plan_price)

-- pgvector for semantic search
product_embeddings (id, org_id, product_id, embedding vector(768), updated_at)
-- Index: CREATE INDEX ON product_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## Environment Variables

All secrets stored in **GCP Secret Manager**. Never `.env` files in production.

```bash
# Database
DATABASE_URL              # postgresql+asyncpg://...
REDIS_URL                 # redis://...

# Auth
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON

# GCP
GCP_PROJECT_ID
GCP_REGION=asia-south1
STORAGE_BUCKET_NAME

# AI
VERTEX_AI_PROJECT_ID
LANGCHAIN_API_KEY         # LangSmith
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=shopos-production
ANTHROPIC_API_KEY         # Claude API

# Payments
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

# Platform
PLATFORM_DOMAIN=shopOS.in
```

---

## Getting Started (Local Development)

```bash
# Prerequisites: Node 20, Python 3.12, Docker, gcloud CLI

# 1. Clone
git clone https://github.com/your-org/shopos.git
cd shopos

# 2. Install (monorepo with pnpm workspaces)
pnpm install

# 3. Backend
cd services/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
# Edit .env.local with your local values

# 4. Start local services
docker compose up -d  # PostgreSQL + Redis

# Run migrations
alembic upgrade head

# Start API
uvicorn main:app --reload --port 8000

# 5. Start admin dashboard
cd apps/platform-admin
pnpm dev  # http://localhost:3000

# 6. Start org admin dashboard
cd apps/org-admin
pnpm dev  # http://localhost:3001
```

---

## Deployment — GCP

```bash
# 1. Set up GCP project
gcloud config set project YOUR_PROJECT_ID
gcloud config set compute/region asia-south1

# 2. Enable APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  dns.googleapis.com \
  pubsub.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firebase.googleapis.com

# 3. Provision infrastructure
cd infra/terraform
terraform init
terraform plan
terraform apply

# 4. Deploy backend
gcloud builds submit --config cloudbuild.yaml

# 5. Set up wildcard DNS
# In Cloud DNS: create zone for shopOS.in
# Add A record: *.shopOS.in → Cloud Load Balancer IP
# Add A record: shopOS.in → Firebase Hosting

# 6. Deploy admin dashboards to Firebase Hosting
firebase deploy --only hosting:platform-admin
firebase deploy --only hosting:org-admin
```

---

## Key Engineering Decisions

**Why not Vercel?** Vercel is US-based. All database, CDN, and compute in `asia-south1` keeps latency under 30ms for Indian users. Vercel would add 200-400ms round trips for database calls.

**Why PostgreSQL RLS over application-level filtering?** Application bugs can accidentally expose cross-tenant data. RLS enforces isolation at the database level — even if a FastAPI route has a bug, PostgreSQL rejects the query.

**Why ARQ over Celery?** FastAPI is async-native. Celery requires extra threading complexity to work with asyncio. ARQ runs in the same event loop.

**Why LangGraph for fraud detection?** Multi-step reasoning (velocity check → address check → Claude reasoning → decision) needs explicit state management. A LangGraph state machine is readable, testable, and retry-safe. A raw while loop is none of those things.

**Why snapshot history?** Small shop owners frequently break their store by experimenting with themes. Snapshots are a safety net that removes anxiety from customization. It's also a retention feature — orgs on Pro/Enterprise have more snapshots, giving them a reason to upgrade.

**Why static export for storefronts?** Product pages need to be indexed by Google. SSR on Cloud Run costs money per request. Static export + CDN = near-zero marginal cost per storefront visit + excellent SEO.

---

## Service Charges — How Money Flows

```
Customer pays ₹1,299 for a kurta on Meena's store
  ↓
Razorpay collects the full amount
  ↓
Platform fee auto-deducted (1.5% on Pro = ₹19)
  ↓
Meena receives ₹1,280 directly to her bank account
  ↓
You receive ₹19 — no manual work, no invoicing
```

### Platform subscription (Org → You)

| Plan | Price | Products | Txn fee | AI desc/mo | Snapshots |
|------|-------|----------|---------|------------|-----------|
| Starter | ₹999/mo | 50 | 2% | 50 | 5 |
| Pro | ₹2,499/mo | 500 | 1.5% | Unlimited | 20 |
| Enterprise | ₹6,999/mo | Unlimited | 1% | Unlimited | Unlimited |

If an org's subscription payment fails → 3-day grace period → storefront goes into maintenance mode (browsable, checkout disabled) → auto-resumes when payment succeeds.

### VIP membership (Customer → Org)

Org admin sets their own price (e.g. ₹99/mo). Customers subscribe for perks like free shipping + early access. Money goes straight to the org's account. Platform fee auto-deducted from this too.

### Auto URL + Custom URL

- **Auto URL**: `{orgslug}.shopOS.in` — generated the moment the org signs up. No configuration needed.
- **Custom URL**: Org admin can connect `meenadresses.com` → they add a CNAME record → Cloud DNS routes it to their Cloud Run storefront. Available on Pro and Enterprise plans.

---

## Roadmap

- **v1.0** — Core platform, 3 templates, basic AI description, Razorpay payments
- **v1.1** — Snapshot history, VIP subscriptions, pgvector search
- **v1.2** — LangGraph fraud agent, Claude support chat, LangSmith observability
- **v2.0** — Custom domains (CNAME → org's own domain), mobile app (React Native)
- **v2.1** — Multi-language storefronts (Hindi, Tamil, Telugu)
- **v3.0** — Marketplace mode (multiple orgs in one discovery feed), affiliate system

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Built by Ushanagalla Shashank · ushanagallashashank@gmail.com · [github.com/UshanagallaShashank](https://github.com/UshanagallaShashank)*