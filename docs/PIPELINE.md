# Deployment Pipeline (GCP)

## Prerequisites

- GCP project created and billing enabled
- `gcloud` CLI installed: `brew install google-cloud-sdk`
- Authenticated: `gcloud auth login`

## 1. Set your project

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud config set compute/region asia-south1
```

## 2. Enable required GCP services

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

## 3. Create Artifact Registry (Docker image storage)

```bash
gcloud artifacts repositories create shopos \
  --repository-format=docker \
  --location=asia-south1
```

## 4. Build and push the API image

```bash
cd services/api
gcloud builds submit \
  --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/shopos/api:latest
```

## 5. Deploy to Cloud Run

```bash
gcloud run deploy shopos-api \
  --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/shopos/api:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 1
```

## 6. Attach secrets

```bash
gcloud run services update shopos-api \
  --update-secrets DATABASE_URL=DATABASE_URL:latest \
  --update-secrets FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest \
  --update-secrets REDIS_URL=REDIS_URL:latest
```

## 7. Verify

```bash
# Get the Cloud Run URL
gcloud run services describe shopos-api --region asia-south1 --format "value(status.url)"

# Test it
curl https://YOUR-URL/health
curl https://YOUR-URL/health/db
```

## Auto-deploy on git push (CI/CD)

Connect Cloud Build to your GitHub repo in GCP Console → Cloud Build → Triggers.
Set trigger: push to `main` → run `cloudbuild.yaml`.
