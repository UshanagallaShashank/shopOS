# Environment Variables

## Setup

```bash
cd services/api
cp .env.example .env.local
# Edit .env.local with your values
```

## Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | `postgresql+asyncpg://shopos:shopos@localhost/shopos` |
| `REDIS_URL` | ✅ | — | `redis://localhost:6379` |
| `FIREBASE_PROJECT_ID` | ✅ | — | From Firebase Console → Project Settings |
| `DEBUG` | ❌ | `false` | Set `true` to log every SQL query |
| `ALLOWED_ORIGINS` | ❌ | `["http://localhost:3000"]` | CORS frontend URLs |

## Where to get each value

**DATABASE_URL** — docker compose creates it locally. On GCP use Cloud SQL connection string.

**FIREBASE_PROJECT_ID** — Firebase Console → gear icon → Project Settings → General → Project ID.

**REDIS_URL** — docker compose creates it locally. On GCP use Memorystore instance IP.

## Production (GCP Secret Manager)

Never use `.env` files in production. All secrets go in Secret Manager.

```bash
echo -n "postgresql+asyncpg://..." | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-project-id" | gcloud secrets create FIREBASE_PROJECT_ID --data-file=-
```

Then mount them in Cloud Run:
```bash
gcloud run services update shopos-api \
  --update-secrets DATABASE_URL=DATABASE_URL:latest \
  --update-secrets FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest
```
