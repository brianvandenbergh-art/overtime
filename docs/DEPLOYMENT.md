# Deployment Guide – OvertimeSA (Free Tier)

## 1. Push to GitHub (Free)

```bash
cd overtime-sa
git init
git add .
git commit -m "Initial OvertimeSA multi-tenant app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/overtime-sa.git
git push -u origin main
```

## 2. Backend – Render.com (Free)

1. Go to https://render.com and sign up with GitHub
2. **New → Web Service**
3. Connect the `overtime-sa` repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && node src/index.js`
   - Environment: Node
5. Add Environment Variables (from `.env.example`):
   - `DATABASE_URL` → Create a free PostgreSQL on Render or use Neon.tech / Supabase free
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `IKHOKHA_APP_ID`, `IKHOKHA_APP_SECRET`, `IKHOKHA_ENTITY_ID`
   - `IKHOKHA_MODE=live` (or test)
   - `FRONTEND_URL` = your Vercel/Netlify URL
   - `WEBHOOK_BASE_URL` = your Render backend URL
6. Deploy

### Free Database options
- **Neon.tech** – generous free PostgreSQL
- **Supabase** – free tier
- **Render PostgreSQL** – free for 90 days then paid

## 3. Frontend – Vercel (Free)

1. Go to https://vercel.com and import the repo
2. Root Directory: `frontend`
3. Framework: Vite
4. Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Deploy

Alternatively use **Netlify** the same way.

## 4. iKhokha Webhook

In your iKhokha dashboard or when creating payment links, the callback URL is already set to:

```
https://your-backend.onrender.com/api/payments/webhook
```

Make sure the backend is publicly reachable.

## 5. PWA / “App”

After deploying the frontend, users can:
- Open the site on mobile Chrome/Safari
- Tap “Add to Home Screen”
- It appears and works like a native app

## 6. Local testing with SQLite (optional)

If you don’t want PostgreSQL locally:

1. In `backend/prisma/schema.prisma` change:
   ```
   provider = "sqlite"
   url      = "file:./dev.db"
   ```
2. `npx prisma migrate dev`
3. Run backend + frontend as usual

---

**Important:** Never commit real `.env` files. Always use the hosting platform’s secret environment variables.
