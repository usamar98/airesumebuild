# Frontend Deployment Guide for Railway

## Current Status
✅ **Backend API**: Successfully deployed and running on Railway  
🔄 **Frontend**: Ready to deploy (this guide)

## Overview
Your backend API is already deployed and working correctly. Now we need to deploy the **frontend React application** as a separate Railway service.

## Step 1: Create a New Railway Service for Frontend

1. **Go to your Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Navigate to your existing project

2. **Add a New Service**
   - Click "New Service" or "+" button
   - Select "GitHub Repo"
   - Choose the same repository (`airesumebuild`)
   - **Important**: This will create a separate service for the frontend

## Step 2: Configure the Frontend Service

### 2.1 Set the Railway Configuration
In your new frontend service settings:

1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npx serve -s dist -l $PORT`
3. **Root Directory**: Leave empty (uses project root)

### 2.2 Set Environment Variables
Add these environment variables in the Railway dashboard for your **frontend service**:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://zrbdftbmydfrdazcffoa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Mzk5MzksImV4cCI6MjA3NDQxNTkzOX0.hw9XUUdx5cP3Kj8NX-IYA65uHk8ROrWqp3Tw-RpWhP0
VITE_API_BASE_URL=https://web-production-3f4a.up.railway.app
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

**Important**: Replace `https://web-production-3f4a.up.railway.app` with your actual backend API URL if it's different.

## Step 3: Deploy the Frontend

1. **Trigger Deployment**
   - Railway will automatically detect the changes and start building
   - The build process will:
     - Install dependencies
     - Build the React application
     - Start serving static files

2. **Monitor the Build**
   - Check the deployment logs in Railway dashboard
   - Look for successful build completion
   - Verify the service starts correctly

## Step 4: Update Backend CORS Settings

Once your frontend is deployed, you'll get a new Railway URL for the frontend (e.g., `https://frontend-production-xyz.up.railway.app`).

**Update your backend environment variables** in Railway:
```env
FRONTEND_URL=https://your-new-frontend-url.up.railway.app
```

## Step 5: Test the Complete Application

1. **Access your frontend URL** (the new Railway domain for frontend service)
2. **Test key features**:
   - User registration/login
   - AI Assistant features
   - Resume builder
   - All API calls to backend

## Architecture After Deployment

```
┌─────────────────────┐    API Calls    ┌─────────────────────┐
│   Frontend Service  │ ──────────────► │   Backend Service   │
│   (React/Vite)      │                 │   (Node.js/Express) │
│   Port: 3000        │                 │   Port: 3002        │
└─────────────────────┘                 └─────────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────────┐                 ┌─────────────────────┐
│   Railway Domain    │                 │   Railway Domain    │
│   (Frontend URL)    │                 │   (Backend API URL) │
└─────────────────────┘                 └─────────────────────┘
```

## Troubleshooting

### If Frontend Build Fails:
1. Check Railway build logs
2. Ensure all environment variables are set
3. Verify `serve` package is in dependencies

### If API Calls Fail:
1. Check `VITE_API_BASE_URL` points to correct backend URL
2. Verify CORS settings in backend
3. Check browser console for errors

### If Authentication Fails:
1. Verify Supabase environment variables
2. Check JWT_SECRET in backend
3. Ensure FRONTEND_URL in backend matches frontend domain

## Files Modified for Deployment

✅ `.env.production` - Production environment variables  
✅ `railway-frontend.json` - Frontend Railway configuration  
✅ `package.json` - Added `serve` dependency  
✅ `vite.config.ts` - Updated proxy settings  

## Next Steps

1. Create the new Railway service for frontend
2. Configure environment variables
3. Deploy and test
4. Update backend CORS settings
5. Enjoy your fully deployed application! 🚀

---

**Need Help?** Check Railway