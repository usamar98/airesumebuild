# Railway Deployment Checklist

## Environment Variables Configuration

The following environment variables must be set in your Railway dashboard:

### ✅ Already Configured (User Provided)
1. `JWT_SECRET` = `CG2Bza5k4K+R9+mHPTPHLyhACv0iu2Xbpd3euoGHyM8=`
2. `NODE_ENV` = `production`
3. `SUPABASE_URL` = `https://zrbdftbmydfrdazcffoa.supabase.co`
4. `VITE_SUPABASE_URL` = `https://zrbdftbmydfrdazcffoa.supabase.co`
5. `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgzOTkzOSwiZXhwIjoyMDc0NDE1OTM5fQ.AOEM0trcOLiBnGRb-xrMYeCouRcoPvatouCVVbOAL5I`
6. `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmRmdGJteWRmcmRhemNmZm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Mzk5MzksImV4cCI6MjA3NDQxNTkzOX0.hw9XUUdx5cP3Kj8NX-IYA65uHk8ROrWqp3Tw-RpWhP0`

### ❌ Missing - MUST BE ADDED

#### Frontend URL Configuration
7. `FRONTEND_URL` = `https://web-production-3f4a.up.railway.app`
   - **IMPORTANT**: Replace with your actual Railway app URL
   - This is used for CORS configuration and email verification links

#### Email Configuration (Required for user verification)
8. `EMAIL_HOST` = `smtp.gmail.com`
9. `EMAIL_PORT` = `587`
10. `EMAIL_USER` = `your-email@gmail.com`
11. `EMAIL_PASS` = `your-app-password`
12. `EMAIL_FROM` = `your-email@gmail.com`

**Note**: For Gmail, you need to:
- Enable 2-factor authentication
- Generate an App Password (not your regular password)
- Use the App Password for `EMAIL_PASS`

#### Optional (for development)
13. `PORT` = `3002` (Railway will override this automatically)

## Deployment Steps

1. **Add Missing Environment Variables**
   - Go to your Railway project dashboard
   - Navigate to Variables tab
   - Add all missing variables listed above

2. **Update FRONTEND_URL**
   - Get your Railway app URL from the deployment
   - Update the `FRONTEND_URL` variable with the correct URL

3. **Configure Email Settings**
   - Set up Gmail App Password or use your preferred email service
   - Add all email-related environment variables

4. **Verify Deployment**
   - Check Railway logs for any errors
   - Test registration and login functionality
   - Verify email verification works

## Troubleshooting

### Common Issues

1. **"Registration failed" Error**
   - Check Railway logs for detailed error messages
   - Verify all environment variables are set correctly
   - Ensure Supabase keys are valid and not expired

2. **Email Verification Not Working**
   - Verify EMAIL_* variables are set correctly
   - Check email service credentials
   - Ensure FRONTEND_URL points to correct Railway app URL

3. **CORS Issues**
   - Verify FRONTEND_URL matches your Railway app URL exactly
   - Check that CORS is configured properly in api/app.ts

### Debug Endpoints

Use these endpoints to debug issues:
- `GET /api/auth/debug/railway` - Check environment variables and Supabase connection
- `GET /api/health` - Basic health check

## Verification Checklist

- [ ] All environment variables added to Railway
- [ ] FRONTEND_URL updated with correct Railway app URL
- [ ] Email configuration tested
- [ ] Registration works without errors
- [ ] Login works for verified users
- [ ] Email verification emails are sent
- [ ] No errors in Railway logs

## Current Status

✅ **Local Testing**: Authentication works perfectly with Railway environment variables
✅ **Code Updates**: Enhanced error logging and debugging implemented
✅ **Environment Sync**: Local .env updated to match Railway configuration
❌ **Missing Variables**: FRONTEND_URL and EMAIL configuration need to be added to Railway

## Next Steps

1. Add the missing environment variables to Railway dashboard
2. Update FRONTEND_URL with your actual Railway app URL
3. Configure email settings for user verification
4. Test the complete authentication flow on Railway