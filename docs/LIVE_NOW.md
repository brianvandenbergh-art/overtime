# Get OvertimeSA LIVE in ~15 minutes (Free)

GitHub stores your code.  
The **live website** runs on free hosts that can actually run a server.

Final link will look like:
- Frontend: https://overtime-xxx.vercel.app   ← THIS is the link for Google App Builder / APK
- Backend:  https://overtime-api.onrender.com

---

## STEP 1 – Database (2 min) – Neon free

1. Go to https://neon.tech → Sign up with GitHub
2. Create a project → copy the connection string  
   Looks like: `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`

---

## STEP 2 – Backend (5 min) – Render free

1. Go to https://render.com → Sign up with GitHub
2. **New → Web Service**
3. Connect your `overtime` repository
4. Settings:
   - **Name:** overtime-api
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/index.js`
5. Environment Variables (add all of these):

```
DATABASE_URL=paste-your-neon-string-here
JWT_SECRET=any-long-random-string-at-least-32-characters
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
FRONTEND_URL=https://overtime-xxx.vercel.app
WEBHOOK_BASE_URL=https://overtime-api.onrender.com
IKHOKHA_APP_ID=your_id
IKHOKHA_APP_SECRET=your_secret
IKHOKHA_ENTITY_ID=your_entity
IKHOKHA_MODE=test
NODE_ENV=production
PORT=10000
```

6. Click **Create Web Service**  
   Wait until it says “Live”.  
   Copy the URL (e.g. `https://overtime-api.onrender.com`)

---

## STEP 3 – Frontend (3 min) – Vercel free

1. Go to https://vercel.com → Sign up with GitHub
2. **Add New Project** → select your `overtime` repo
3. Settings:
   - **Root Directory:** `frontend`  (click Edit)
   - Framework Preset: Vite
4. Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://overtime-api.onrender.com/api`   ← your Render URL + /api
5. Click **Deploy**

Done. Your live app URL is the Vercel link, for example:

**https://overtime-xxxxx.vercel.app**

Use THAT link in Google App Builder / PWA Builder to generate the APK.

---

## STEP 4 – Turn on GitHub Pages (optional extra)

Only shows the static marketing pages.  
The real working app is the Vercel link above.

---

## After it is live

1. Open the Vercel URL on your phone
2. Register a company → you get an Invite Code
3. Join as employee with that code
4. Log overtime, approve, etc.
5. Paste the same Vercel URL into Google’s PWA/App builder for the APK

When a client is happy, you can later move the same code to a paid VPS or bigger host – nothing changes in the code.
