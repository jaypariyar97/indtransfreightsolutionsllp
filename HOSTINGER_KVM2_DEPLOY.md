# Hostinger KVM2 Deployment

This repository is now set up to deploy on a Linux VPS with Docker Compose while keeping the current application scope unchanged.

## 1. Prepare the server

- Install Docker Engine and the Docker Compose plugin.
- Point your domain's `A` record to the VPS public IP.
- Open inbound port `80` in the VPS firewall/security group.

## 2. Prepare application secrets

1. Copy `.env.example` to `.env`.
2. Replace these values before going live:
   - `POSTGRES_PASSWORD`
   - `APP_JWT_SECRET`
   - `APP_BOOTSTRAP_ADMIN_PASSWORD`
   - `APP_CORS_ALLOWED_ORIGINS`
   - `APP_PUBLIC_URL`
   - SMTP settings if you want password-reset emails delivered

`APP_JWT_SECRET` should be at least 32 random characters.

## 3. Keep GitHub clean

Do not commit real runtime state. The repo now ignores:

- `uploads/`
- `logs/`
- `backend/data/`
- `backend/uploads/`
- build output and local dependency folders

If you have already staged old runtime files locally, unstage them before your first push.

## 4. Build and start

From the repository root:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f nginx
```

## 5. What the stack does

- `db`: PostgreSQL 16 with persistent volume storage
- `app`: Spring Boot backend plus built React frontend
- `nginx`: public entrypoint on port `80`

Browser traffic uses:

- `/` for the React app
- `/api/*` externally for API calls

Nginx rewrites `/api/*` back to the app container's internal endpoints so the frontend can keep using `/api` without changing business behavior.

## 6. HTTPS

This repo now exposes only port `80` directly because no certificate automation is bundled here.

For production HTTPS, place one of these in front of the stack:

- Hostinger/Cloudflare proxy with SSL
- Nginx Proxy Manager
- A separate Certbot-enabled reverse proxy

Once HTTPS is enabled, update:

- `APP_PUBLIC_URL=https://www.indtransfreightsolutions.com`
- `APP_CORS_ALLOWED_ORIGINS=https://www.indtransfreightsolutions.com`
