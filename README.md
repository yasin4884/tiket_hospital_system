<div align="center">

# 🎫 سیستم تیکتینگ بیمارستان

سیستم ثبت و پیگیری تیکت برای کارکنان و ادمین، با به‌روزرسانی لحظه‌ای (Realtime)

<p>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

<p>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO">
</p>

<p>
  <img src="https://img.shields.io/github/last-commit/yasin4884/tiketing_system?style=flat-square" alt="Last commit">
  <img src="https://img.shields.io/github/stars/yasin4884/tiketing_system?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/github/repo-size/yasin4884/tiketing_system?style=flat-square" alt="Repo size">
</p>

</div>

---

## 📌 معرفی سرویس‌ها

| سرویس | تکنولوژی | پورت |
|--------|-----------|------|
| API | FastAPI + Uvicorn + SQLAlchemy + Socket.IO | `4000` |
| پورتال کارکنان | Next.js | `3000` |
| پنل ادمین | Next.js | `3001` |
| دیتابیس | PostgreSQL 16 (Docker) | `5434` |
| کش | Redis 7 (Docker) | `6379` |

---

## 📥 کلون از گیت‌هاب

```bash
git clone https://github.com/yasin4884/tiketing_system.git
cd tiketing_system
```

---

## ✅ پیش‌نیازها

- **Node.js 18+** و npm
- **Python 3.11+**
- **Docker Desktop** (روشن باشد)

---

## 🚀 راه‌اندازی از صفر (ویندوز / PowerShell)

همه دستورها از **ریشه پروژه** اجرا می‌شوند.

### ۱) وابستگی‌های ریشه و فرانت‌ها

```powershell
npm install
npm run install:all
```

### ۲) محیط مجازی پایتون و پکیج‌های بک‌اند

```powershell
npm run install:backend
```

یا دستی:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
```

### ۳) فایل‌های `.env`

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item admin\.env.example admin\.env
```

مقادیر پیش‌فرض با `docker-compose.yml` هماهنگ است.

### ۴) بالا آوردن Postgres + Redis

```powershell
docker compose up -d
```

صبر کنید تا healthy شوند:

```powershell
docker compose ps
```

### ۵) ساخت جداول

```powershell
npm run db:push
```

### ۶) اجرای همه سرویس‌ها

```powershell
npm run dev
```

این دستور به‌ترتیب: دیتابیس را بالا می‌آورد، صبر می‌کند، schema را می‌سازد، سپس API + Staff + Admin را با هم اجرا می‌کند.

---

## 🌐 آدرس‌ها بعد از اجرا

| سرویس | URL |
|--------|-----|
| کارکنان | http://localhost:3000 |
| ادمین | http://localhost:3001 |
| API Health | http://localhost:4000/api/health |
| Docs (Swagger) | http://localhost:4000/docs |

### اولین استفاده

1. به http://localhost:3000/register بروید و حساب کارکنان بسازید
   (رمز حداقل ۸ کاراکتر، ترکیبی از حروف و عدد، مثلاً `Pass12345`)
2. به http://localhost:3001/register بروید و حساب ادمین بسازید
3. در پنل کارکنان تیکت بسازید؛ در پنل ادمین ببینید، پاسخ دهید و وضعیت را تغییر دهید

---

## 📁 ساختار پوشه‌ها

```
├── backend/          # FastAPI (Python)
│   ├── app/          # کد اصلی API
│   ├── scripts/      # استرس‌تست
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # پورتال کارکنان (Next.js :3000)
├── admin/            # پنل ادمین (Next.js :3001)
├── docker-compose.yml
├── package.json      # concurrently + اسکریپت‌های کمکی
├── README.md
└── DEPLOY.md
```

---

## 🛠 اسکریپت‌های مفید

```powershell
npm run dev          # اجرای کامل توسعه
npm run db:up        # فقط Docker (Postgres + Redis)
npm run db:down      # خاموش کردن Docker
npm run db:push      # ساخت/همگام‌سازی schema
npm run stress       # تست بار هر دو پنل (API باید بالا باشد)
```

اجرای API در حالت نزدیک به Production (چند worker، Redis لازم است):

```powershell
cd backend
npm run start
```

---

## 🗄 مشخصات دیتابیس (Docker)

| مورد | مقدار |
|------|--------|
| Host | `localhost` |
| Port | `5434` |
| DB | `hospital_tickets` |
| User | `ticket_admin` |
| Password | در فایل `backend/.env` و `docker-compose.yml` تنظیم می‌شود |

الگوی رشته اتصال:

```
postgresql://<USER>:<PASSWORD>@localhost:5434/hospital_tickets
```

> ⚠️ برای Production حتماً رمزها را عوض کنید و فایل‌های `.env` را هرگز در گیت commit نکنید.
> دستور `docker compose down -v` را بی‌دلیل نزنید؛ volume دیتابیس پاک می‌شود.

---

## 🔌 APIهای اصلی

| مسیر | نقش |
|------|------|
| `/api/staff-auth/*` | ثبت‌نام / لاگین / me کارکنان |
| `/api/auth/*` | ثبت‌نام / لاگین / me ادمین |
| `/api/staff/tickets/*` | تیکت‌های کارکنان |
| `/api/tickets/*` | تیکت‌های ادمین (+ مهمان) |
| Socket.IO | رویدادهای realtime تیکت |

---

## 🧯 عیب‌یابی

| مشکل | راه‌حل |
|------|-----|
| `EADDRINUSE :3000/:3001/:4000` | پروسه‌های قبلی را ببندید (Ctrl+C) یا پورت را آزاد کنید |
| `Can't reach database` | `docker compose up -d` را بزنید و Docker Desktop را روشن کنید |
| `Authentication failed` (DB) | `backend/.env` را با `docker-compose.yml` یکسان کنید |
| رمز رد می‌شود | حداقل ۸ کاراکتر + حرف و عدد |
| CORS | `CORS_ORIGIN` باید شامل `3000` و `3001` باشد |

---

## ☁️ استقرار روی سرور

جزئیات در [`DEPLOY.md`](./DEPLOY.md).