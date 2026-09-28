# Production Deployment Guide: Telegram Member Exporter

This guide provides step-by-step instructions to deploy the **Telegram Member Exporter** application to production.

---

## 🏗 Architecture Overview

The system consists of three main decoupled tiers:

1. **Frontend**: Next.js (App Router, React, Tailwind CSS)
   - Handles user interface for Telegram login, group discovery, member inspection, and CSV downloads.
   - Communicates with the backend using JWT Bearer Tokens in the `Authorization` header.
   - Configurable API endpoint via `NEXT_PUBLIC_API_URL`.

2. **Backend**: FastAPI (Python 3.11+, Telethon 1.35+, AsyncPG)
   - Provides secure MTProto Telegram API orchestration via Telethon.
   - Manages encrypted Telegram session strings using Fernet symmetric encryption.
   - Handles JWT creation, user database records, and CSV export streaming.
   - Production-ready with Uvicorn multi-worker process management and trusted proxy header support.

3. **Database**: PostgreSQL (v15+)
   - Stores users, encrypted Telegram sessions, and member export history logs.
   - Auto-initialized on startup via SQLAlchemy async engine migrations.

---

## 🔐 Environment Variables Reference

### Backend Environment Variables (`backend/.env`)

| Variable Name | Required | Default / Example | Description |
|---|---|---|---|
| `TELEGRAM_API_ID` | **Yes** | `123456` | Telegram API ID from [my.telegram.org](https://my.telegram.org). |
| `TELEGRAM_API_HASH` | **Yes** | `0123...abcdef` | Telegram API Hash from [my.telegram.org](https://my.telegram.org). |
| `SECRET_KEY` | **Yes** | `32+ char secret` | Secret key used for signing JWT tokens. |
| `ENCRYPTION_SECRET` | **Yes** | `32-byte base64` | Key for Fernet symmetric encryption of Telegram session strings. |
| `DATABASE_URL` | **Yes** | `postgresql+asyncpg://...` | Full PostgreSQL connection URL (e.g. Supabase, Render, AWS RDS). |
| `ALLOWED_ORIGINS` | **Yes** | `https://app.yourdomain.com` | Comma-separated list of allowed frontend domain origins for CORS. |

> **IMPORTANT SECURITY NOTE**: Never commit `.env` files or expose `TELEGRAM_API_HASH`, `SECRET_KEY`, `ENCRYPTION_SECRET`, or database credentials to public repos or frontend bundles.

### Frontend Environment Variables (`frontend/.env.local`)

| Variable Name | Required | Default / Example | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.yourdomain.com` | Base URL of the deployed FastAPI backend. |

---

## 🗄 1. PostgreSQL Database Setup

### Option A: Managed PostgreSQL (Recommended)
Use a managed provider such as **Supabase**, **Render Postgres**, **Neon**, or **AWS RDS**:
1. Create a PostgreSQL 15 database instance.
2. Retrieve the connection string.
3. Update the scheme prefix to `postgresql+asyncpg://` if not already present:
   ```text
   postgresql+asyncpg://username:password@db-host.com:5432/telegram_exporter
   ```

### Option B: Docker PostgreSQL
```bash
docker run -d \
  --name tele_exporter_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=telegram_exporter \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## ⚙️ 2. Backend Deployment (FastAPI)

### Option A: VPS with Systemd + Nginx Reverse Proxy (Recommended for Production)

1. **Install Dependencies**:
   ```bash
   sudo apt update && sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx
   ```

2. **Clone & Setup Virtualenv**:
   ```bash
   git clone <repo-url> /var/www/telegram-exporter
   cd /var/www/telegram-exporter/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install --no-cache-dir -r requirements.txt
   ```

3. **Configure Environment File** (`/var/www/telegram-exporter/backend/.env`):
   ```env
   TELEGRAM_API_ID=123456
   TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
   SECRET_KEY=generate_with_openssl_rand_hex_32
   ENCRYPTION_SECRET=generate_with_fernet_generate_key
   DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/telegram_exporter
   ALLOWED_ORIGINS=https://app.yourdomain.com
   ```

4. **Create Systemd Service** (`/etc/systemd/system/telegram-backend.service`):
   ```ini
   [Unit]
   Description=Telegram Member Exporter FastAPI Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/telegram-exporter/backend
   ExecStart=/var/www/telegram-exporter/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4 --proxy-headers
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start Service**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable telegram-backend
   sudo systemctl start telegram-backend
   ```

---

## 🌐 3. Nginx & Domain HTTPS Configuration

1. **Create Nginx Site Configuration** (`/etc/nginx/sites-available/telegram-exporter`):
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Enable Site & Obtain Let's Encrypt SSL Certificate**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/telegram-exporter /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 💻 4. Frontend Deployment (Next.js)

### Option A: Vercel (Recommended)
1. Import the repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
4. Click **Deploy**.

### Option B: Docker Container Deployment
```bash
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com -t telegram-frontend .
docker run -d -p 3000:3000 --name tele_frontend telegram-frontend
```

---

## 🐳 5. Full Production Docker Compose Deployment

If deploying full stack via Docker Compose on a single server:

1. Update `.env` in the root directory:
   ```env
   TELEGRAM_API_ID=123456
   TELEGRAM_API_HASH=your_api_hash
   SECRET_KEY=your_jwt_secret
   ENCRYPTION_SECRET=your_fernet_secret
   ALLOWED_ORIGINS=https://yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. Launch stack:
   ```bash
   docker-compose up -d --build
   ```

---

## 🔄 6. Database Migrations & Initialization

- The application automatically initializes and verifies schema tables on startup via SQLAlchemy `init_db()` during the FastAPI lifespan context.
- To execute manual database resets or verification, test the health endpoint:
  ```bash
  curl -X GET https://api.yourdomain.com/health
  ```
- Response:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "service": "Telegram Member Exporter",
    "version": "1.0.0"
  }
  ```

---

## ⏪ 7. Rollback Procedure

If a deployment failure occurs:

1. **Backend Rollback**:
   ```bash
   cd /var/www/telegram-exporter
   git checkout <last-working-commit-hash>
   sudo systemctl restart telegram-backend
   ```

2. **Frontend Rollback**:
   - On Vercel: Go to Deployments -> Select Previous Successful Build -> Click **Redeploy / Instant Rollback**.
   - On Docker:
     ```bash
     docker stop tele_frontend
     docker run -d -p 3000:3000 --name tele_frontend telegram-frontend:<previous-tag>
     ```

3. **Database Health Verification**:
   ```bash
   curl -i https://api.yourdomain.com/health
   ```
