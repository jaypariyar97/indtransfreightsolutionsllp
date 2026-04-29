# Smoke Test - After `docker compose up`

One-shot checks to confirm the stack is healthy. All commands assume the
nginx reverse proxy is reachable at `http://localhost` (port 80).

## 1. Containers are up

```bash
docker compose ps
```

Expected: `indtrans-postgres` (healthy), `indtrans-app` (running),
`indtrans-nginx` (running).

## 2. Landing page renders

```bash
curl -sI http://localhost/ | head -n1
# HTTP/1.1 200 OK
```

## 3. API reachable through the proxy

```bash
curl -sI http://localhost/api/gallery | head -n1
# HTTP/1.1 200 OK
```

## 4. Login as seeded admin and grab a JWT

Default seeded admin from `DataInitializer.java`:
- **Email:** `operations@indtransfreightsolutions.com`
- **Password:** `Indtrans 1234`
- **First login forces a password change** - the UI automatically redirects to
  `/admin/change-password` until a new password is set.

```bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"operations@indtransfreightsolutions.com","password":"Indtrans 1234","role":"admin"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))")
echo "$TOKEN" | head -c 20 ; echo "..."
```

## 5. Upload a gallery image

```bash
curl -s -X POST http://localhost/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/any.jpg" \
  -F "title=Smoke Test" \
  -F "category=FTL"
```

Then fetch the file it returned:

```bash
curl -sI "http://localhost/api/uploads/gallery/<the-uuid>.jpg" | head -n1
# HTTP/1.1 200 OK
```

## 6. Upload a payment receipt

```bash
BILL_ID=$(curl -s http://localhost/api/billing \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d[0]['id'] if d else '')")

curl -s -X POST "http://localhost/api/billing/$BILL_ID/receipt" \
  -H "Authorization: Bearer $TOKEN" \
  -F "receipt=@/path/to/receipt.pdf"
```

## 7. Tail logs if anything fails

```bash
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f postgres
```

## 8. Clean up

```bash
docker compose down
docker compose down -v
```

## 9. Change password flow

```bash
curl -s -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"operations@indtransfreightsolutions.com","password":"Indtrans 1234","role":"admin"}'

curl -s -X POST http://localhost/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"currentPassword":"Indtrans 1234","newPassword":"NewS3cret!"}'
```

## 10. Forgot-password flow

```bash
curl -s -X POST http://localhost/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"operations@indtransfreightsolutions.com"}'

docker compose logs app | grep "reset-password?token="

curl -s -X POST http://localhost/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"token":"PASTE_TOKEN_HERE","newPassword":"NewS3cret!"}'
```
