# راهنمای استقرار و اطلاعات دسترسی

## اطلاعات دیتابیس (پیش‌فرض توسعه)

| مورد | مقدار |
|------|--------|
| **نوع** | PostgreSQL 16 (Docker) |
| **Host** | `localhost` |
| **Port** | `5434` |
| **Database** | `hospital_tickets` |
| **User** | `postgres` |
| **Password** | `postgres` |

**Connection String:**
```
postgresql://postgres:postgres@localhost:5434/hospital_tickets?schema=public
```

> PostgreSQL ویندوز شما روی پورت 5432 است — دیتابیس پروژه جداگانه روی **5434** (Docker) اجرا می‌شود.

---

## متغیرهای محیطی

### backend/.env
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/hospital_tickets?schema=public"
JWT_SECRET="dev-secret-change-in-production-2024"
PORT=4000
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

### frontend/.env و admin/.env
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### تغییر رمز دیتابیس

1. `docker-compose.yml` → `POSTGRES_PASSWORD`
2. `backend/.env` → `DATABASE_URL`
3. ری‌استارت: `docker compose down && docker compose up -d`

---

## استقرار روی سرور لینوکس (Ubuntu)

### معماری پیشنهادی

```
tickets.hospital.ir   → Frontend (پورت 3000)
admin.hospital.ir     → Admin Panel (پورت 3001)
api.hospital.ir       → Backend API (پورت 4000)
```

---

### مرحله ۱ — آماده‌سازی سرور

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo npm install -g pm2
sudo systemctl enable docker && sudo systemctl start docker
```

---

### مرحله ۲ — آپلود پروژه

```bash
cd /var/www
git clone <repo-url> tiket
cd tiket
npm install && npm run install:all
```

---

### مرحله ۳ — دیتابیس Production

در `docker-compose.yml` رمز قوی بگذارید و پورت را فقط localhost کنید:

```yaml
ports:
  - "127.0.0.1:5434:5432"
environment:
  POSTGRES_PASSWORD: "رمز-قوی-شما"
```

`backend/.env`:
```env
DATABASE_URL="postgresql://postgres:رمز-قوی-شما@localhost:5434/hospital_tickets?schema=public"
JWT_SECRET="یک-رشته-تصادفی-حداقل-۳۲-کاراکتر"
PORT=4000
CORS_ORIGIN="https://tickets.hospital.ir,https://admin.hospital.ir"
NODE_ENV=production
```

```bash
docker compose up -d
npm run db:generate && npm run db:push
```

---

### مرحله ۴ — Build

```bash
echo "NEXT_PUBLIC_API_URL=https://api.hospital.ir" > frontend/.env
echo "NEXT_PUBLIC_API_URL=https://api.hospital.ir" > admin/.env
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
cd admin && npm run build && cd ..
```

---

### مرحله ۵ — PM2

```bash
pm2 start backend/dist/index.js --name ticket-api
pm2 start npm --name ticket-frontend -- run start --prefix frontend
pm2 start npm --name ticket-admin -- run start --prefix admin
pm2 save && pm2 startup
```

---

### مرحله ۶ — Nginx + SSL

فایل `/etc/nginx/sites-available/tickets` با سه server block برای api، tickets و admin (proxy به پورت‌های 4000، 3000، 3001).

```bash
sudo ln -s /etc/nginx/sites-available/tickets /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.hospital.ir -d tickets.hospital.ir -d admin.hospital.ir
```

---

## چک‌لیست امنیت

- JWT_SECRET قوی و تصادفی
- رمز PostgreSQL قوی
- دیتابیس فقط localhost
- HTTPS فعال
- `.env` در git commit نشود

### بک‌آپ

```bash
docker exec hospital_ticket_db pg_dump -U postgres hospital_tickets > backup.sql
```

---

## آدرس‌های محلی

| سرویس | URL |
|--------|-----|
| کارکنان | http://localhost:3000 |
| ادمین | http://localhost:3001 |
| API | http://localhost:4000/api/health |
