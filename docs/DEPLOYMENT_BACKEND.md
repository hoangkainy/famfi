# FamFi Backend Deployment Guide

## Railway Deployment (Recommended)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `famfi-v2` repository

### Step 3: Configure Service
1. Click on the service
2. Go to **Settings** tab
3. Set **Root Directory**: `apps/api`
4. Set **Build Command**: `npm run build`
5. Set **Start Command**: `npm start`

### Step 4: Add Environment Variables
Go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbG...
SUPABASE_SECRET_KEY=eyJhbG...
FRONTEND_URL=https://famfi.vercel.app
```

### Step 5: Generate Domain
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `famfi-api.railway.app`)

### Step 6: Update Supabase
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add Railway domain to **Redirect URLs**

### Step 7: Verify Deployment
```bash
curl https://your-api.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-12T...",
  "environment": "production"
}
```

---

## Environment Variables Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3001` | Server port (Railway sets automatically) |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | `eyJhbG...` | Supabase anon/public key |
| `SUPABASE_SECRET_KEY` | `eyJhbG...` | Supabase service role key |
| `FRONTEND_URL` | `https://famfi.vercel.app` | Frontend URL for CORS |

---

## Troubleshooting

### Build fails
- Check `apps/api/package.json` has correct scripts
- Ensure TypeScript compiles: `npm run build` locally

### Database connection fails
- Verify Supabase keys are correct
- Check Supabase project is not paused

### CORS errors
- Add frontend URL to `FRONTEND_URL` env var
- Redeploy after changing env vars

---

## Post-Deployment Checklist

- [ ] `/health` returns 200
- [ ] `/api/db-test` returns success
- [ ] Frontend can call API
- [ ] Google OAuth works with new URLs
