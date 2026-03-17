# 🚀 Deploy LensLink to Render.com

> Full-stack deployment — Node.js server serves both the REST API **and** the
> static `index.html` from the same Render Web Service.

## 📋 Prerequisites
- ✅ Code pushed to a **GitHub** repository
- ⏳ MongoDB Atlas free cluster (Step 1 below)
- ⏳ Render.com account (free)

---

## 🗄️ STEP 1 — MongoDB Atlas (if not already done)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Create a free M0 cluster**
2. **Database Access** → Add user `lenslink-user` → Read & Write privilege → save the password
3. **Network Access** → Add IP `0.0.0.0/0` (allow all — needed for Render's dynamic IPs)
4. **Database** → Connect → "Connect your application" → copy the URI and replace `<password>`:
   ```
   mongodb+srv://lenslink-user:YOUR_PASSWORD@lenslink-cluster.xxxxx.mongodb.net/lenslink?retryWrites=true&w=majority
   ```
5. **Save this URI** — you'll paste it into Render in the next step.

---

## 🌐 STEP 2 — Push code to GitHub

Make sure all files (including `render.yaml`) are committed and pushed:
```bash
git add .
git commit -m "Add Render deployment config"
git push
```

---

## 🚀 STEP 3 — Create the Render Web Service

1. Go to [render.com](https://render.com) → **New +** → **Web Service**
2. Connect your GitHub account and select the **LensLink** repository
3. Render will detect `render.yaml` automatically — click **Apply**
4. If it doesn't detect it, set these manually:

| Setting | Value |
|---|---|
| **Name** | `lenslink` |
| **Root Directory** | *(leave blank — use repo root)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Plan** | `Free` |
| **Health Check Path** | `/api/health` |

---

## 🔑 STEP 4 — Set Environment Variables in Render Dashboard

Go to your service → **Environment** tab → add these:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI from Step 1 |
| `JWT_SECRET` | any long random string |
| `APP_URL` | `https://lenslink.onrender.com` *(your actual Render URL)* |
| `GMAIL_USER` | `saikumarreddyappidi274@gmail.com` |
| `GMAIL_APP_PASSWORD` | `cdfy bidl jmqe iplw` |
| `ADMIN_EMAIL` | `saikumarreddyappidi274@gmail.com` |

> ⚠️ Do **not** set `PORT` — Render sets it automatically.

Click **Save Changes** — Render will redeploy automatically.

---

## ✅ STEP 5 — Verify Deployment

Once the build goes green, open:
```
https://lenslink.onrender.com/api/health
```
Expected response:
```json
{ "success": true, "status": "ok", "db": "connected" }
```

Then open the full app:
```
https://lenslink.onrender.com
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| Build fails | Check Render logs; make sure `package.json` is in repo root |
| `db: disconnected` | Double-check `MONGODB_URI` and Atlas network access (0.0.0.0/0) |
| Emails not sending | Verify `GMAIL_USER` + `GMAIL_APP_PASSWORD` env vars match your `.env` |
| App crashes | Check Logs tab; usually a missing env var — `MONGODB_URI` or `JWT_SECRET` |
| App sleeps (free tier) | Free Render services sleep after 15 min inactivity; first request takes ~30 sec to wake |

---

## 🔄 Auto-Deploy After Code Changes

Push to GitHub `main` branch → Render rebuilds and redeploys automatically.



### 2.3 Configure Deployment Settings
Fill out these settings exactly:


