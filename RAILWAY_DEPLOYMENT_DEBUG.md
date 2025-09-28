# Railway Deployment Debug Guide

## Current Issues Identified

Based on the analysis, here are the critical issues causing registration failures:

### 1. Environment Variables with Placeholder Values

The following environment variables in your `.env` file contain placeholder values that MUST be updated in Railway:

```bash
# ❌ CRITICAL: These are placeholder values
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-railway
FRONTEND_URL=https://your-railway-app-url.railway.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## Step-by-Step Fix Instructions

### Step 1: Update Railway Environment Variables

1. **Go to Railway Dashboard** → Your Project → Variables tab

2. **Add/Update these variables:**

```bash
# Generate a strong JWT secret (32+ characters)
JWT_SECRET=your-actual-strong-jwt-secret-here-32-chars-minimum

# Your actual Railway app URL (find in Railway dashboard)
FRONTEND_URL=https://your-actual-railway-app.railway.app

# Email configuration (if you want email verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-actual-app-password
EMAIL_FROM=your-actual-email@gmail.com

# Set production environment
NODE_ENV=production
```

### Step 2: Generate Strong JWT Secret

Use one of these methods to generate a secure JWT secret:

```bash
# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 32

# Method 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### Step 3: Find Your Railway App URL

1. **Railway Dashboard Method:**
   - Go to your Railway project
   - Click on your service
   - Go to "Settings" tab
   - Find "Public Domain" section
   - Copy the URL (e.g., `https://your-app-name.railway.app`)

2. **Railway CLI Method:**
   ```bash
   railway status
   ```

### Step 4: Test the Debug Endpoint

After updating environment variables:

1. **Wait for Railway to redeploy** (usually 1-2 minutes)

2. **Test the debug endpoint:**
   ```bash
   curl https://your-railway-app.railway.app/api/auth/debug
   ```

3. **Check the response for:**
   - `hasJwtSecret: true`
   - `hasFrontendUrl: true`
   - `frontendUrl: "https://your-actual-app.railway.app"`
   - `supabaseConnection: "SUCCESS"`
   - `databaseTables: "SUCCESS"`
   - `authAdmin: "SUCCESS"`
   - `errors: []` (should be empty)

### Step 5: Test Registration

After confirming the debug endpoint shows all green:

```bash
curl -X POST https://your-railway-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

## Common Issues and Solutions

### Issue 1: JWT_SECRET Still Placeholder
**Symptom:** Registration fails with token errors
**Solution:** Ensure JWT_SECRET is updated in Railway variables (not just .env file)

### Issue 2: FRONTEND_URL Still Placeholder
**Symptom:** CORS errors or redirect issues
**Solution:** Set FRONTEND_URL to your actual Railway app URL

### Issue 3: Supabase Connection Fails
**Symptom:** `supabaseConnection: "ERROR"` in debug endpoint
**Solution:** Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct

### Issue 4: Database Table Access Denied
**Symptom:** `databaseTables: "ERROR"` in debug endpoint
**Solution:** Check Supabase RLS policies and table permissions

### Issue 5: Auth Admin Fails
**Symptom:** `authAdmin: "ERROR"` in debug endpoint
**Solution:** Verify SUPABASE_SERVICE_ROLE_KEY has admin privileges

## Verification Checklist

- [ ] JWT_SECRET is 32+ characters and not a placeholder
- [ ] FRONTEND_URL matches your actual Railway app URL
- [ ] NODE_ENV is set to "production"
- [ ] Debug endpoint returns all SUCCESS statuses
- [ ] Debug endpoint has empty errors array
- [ ] Registration test succeeds

## Railway Deployment Logs

To check Railway logs for errors:

1. **Railway Dashboard:** Project → Deployments → Click latest deployment → View logs
2. **Railway CLI:** `railway logs`

Look for:
- Environment variable loading
- Supabase connection errors
- Registration attempt logs with request IDs

## Next Steps

1. Update the environment variables in Railway
2. Wait for automatic redeployment
3. Test the debug endpoint
4. Test user registration
5. If issues persist, check Railway logs for specific error messages

## Support

If you continue to have issues after following this guide:

1. Share the output of the debug endpoint
2. Share relevant Railway deployment logs
3. Confirm which environment variables you've updated