# Gmail SMTP Setup Guide for Railway Deployment

## Problem
You're not receiving authentication emails because your Railway environment variables contain placeholder values instead of real Gmail credentials.

## Current Placeholder Values (❌ Won't Work)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com          # ❌ Placeholder
EMAIL_PASS=app-password-placeholder     # ❌ Placeholder
EMAIL_FROM=noreply@example.com          # ❌ Placeholder
```

## Solution: Set Up Real Gmail SMTP Authentication

### Step 1: Create or Use a Gmail Account

1. **Option A: Use your existing Gmail account**
   - Go to [gmail.com](https://gmail.com)
   - Sign in to your account

2. **Option B: Create a dedicated email account (Recommended)**
   - Create a new Gmail account specifically for your app
   - Example: `yourappname.noreply@gmail.com`

### Step 2: Enable 2-Factor Authentication

**⚠️ IMPORTANT: You MUST enable 2FA to generate App Passwords**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification"
3. Follow the setup process to enable 2FA
4. Verify with your phone number or authenticator app

### Step 3: Generate Gmail App Password

1. **Go to App Passwords:**
   - Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Or go to Google Account → Security → 2-Step Verification → App passwords

2. **Create App Password:**
   - Select "Mail" as the app
   - Select "Other (custom name)" as the device
   - Enter a name like "Resume Builder App" or "Railway Deployment"
   - Click "Generate"

3. **Copy the 16-character password:**
   - Google will show a 16-character password like: `abcd efgh ijkl mnop`
   - **Copy this immediately** - you won't see it again!
   - Remove spaces: `abcdefghijklmnop`

### Step 4: Update Railway Environment Variables

Replace your Railway environment variables with these **real values**:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address@gmail.com        # ✅ Your real Gmail
EMAIL_PASS=abcdefghijklmnop                     # ✅ Your 16-char App Password
EMAIL_FROM=your-gmail-address@gmail.com        # ✅ Your real Gmail
```

**Example with real values:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=resumebuilder.noreply@gmail.com
EMAIL_PASS=xyzw1234abcd5678
EMAIL_FROM=resumebuilder.noreply@gmail.com
```

### Step 5: Update Railway Variables

1. **Go to your Railway project dashboard**
2. **Click on "Variables" tab**
3. **Update each variable:**
   - `EMAIL_USER` → your real Gmail address
   - `EMAIL_PASS` → your 16-character App Password
   - `EMAIL_FROM` → your real Gmail address
4. **Save changes**
5. **Redeploy your application**

## Security Best Practices

### ✅ DO:
- Use a dedicated Gmail account for your app
- Keep your App Password secure and private
- Use environment variables (never hardcode in source code)
- Regenerate App Password if compromised

### ❌ DON'T:
- Use your personal Gmail password
- Share App Passwords
- Commit credentials to Git
- Use the same credentials across multiple apps

## Testing Your Configuration

### Local Testing (Optional)
You can test locally by updating your `.env` file:

```bash
# Update your local .env file
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-gmail-address@gmail.com
```

Then test registration to see if emails are sent.

### Railway Testing
1. Update Railway environment variables
2. Redeploy your application
3. Try registering a new account
4. Check your email inbox (and spam folder)

## Common Issues & Troubleshooting

### Issue 1: "Invalid login" or "Authentication failed"
**Cause:** Wrong credentials or App Password not generated
**Solution:**
- Verify 2FA is enabled
- Regenerate App Password
- Double-check EMAIL_USER and EMAIL_PASS values

### Issue 2: "Less secure app access"
**Cause:** Trying to use regular Gmail password instead of App Password
**Solution:**
- Generate and use App Password (16 characters)
- Never use your regular Gmail password

### Issue 3: Emails going to spam
**Cause:** Gmail's spam filters
**Solution:**
- Check recipient's spam/junk folder
- Consider using a custom domain email later
- Add proper SPF/DKIM records (advanced)

### Issue 4: "Connection timeout"
**Cause:** Network or firewall issues
**Solution:**
- Verify EMAIL_HOST=smtp.gmail.com
- Verify EMAIL_PORT=587
- Check Railway's network connectivity

### Issue 5: Railway deployment not picking up new variables
**Cause:** Variables not saved or deployment not triggered
**Solution:**
- Ensure variables are saved in Railway dashboard
- Manually trigger a new deployment
- Check Railway logs for errors

## Alternative Email Services

If Gmail doesn't work for you, consider these alternatives:

### SendGrid (Recommended for production)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Mailgun
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

### AWS SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-access-key-id
EMAIL_PASS=your-aws-secret-access-key
EMAIL_FROM=noreply@yourdomain.com
```

## Next Steps

1. ✅ Enable 2FA on your Gmail account
2. ✅ Generate Gmail App Password
3. ✅ Update Railway environment variables
4. ✅ Redeploy your application
5. ✅ Test registration and email delivery
6. ✅ Check spam folders if needed

## Support

If you continue having issues:
1. Check Railway deployment logs
2. Verify all environment variables are set correctly
3. Test with a different email address
4. Consider switching to SendGrid for production use

---

**Remember:** Never commit real credentials to your Git repository. Always use environment variables for sensitive information.