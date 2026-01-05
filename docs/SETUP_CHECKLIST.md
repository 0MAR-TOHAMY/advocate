# 🚀 Authentication System Setup Checklist

Use this checklist to set up and verify the authentication system.

## ✅ Installation

- [ ] Navigate to advocate directory: `cd advocate`
- [ ] Install dependencies: `pnpm install`
- [ ] Verify installation completed without errors

## ⚙️ Configuration

### Database
- [ ] Database is running (PostgreSQL)
- [ ] `DATABASE_URL` is set in `.env.local`
- [ ] Database schema is up to date (`pnpm db:push`)

### JWT Configuration
- [ ] Generate secure `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Set `JWT_SECRET` in `.env.local`
- [ ] Configure `JWT_ACCESS_EXPIRES` (default: 15m)
- [ ] Configure `JWT_REFRESH_EXPIRES` (default: 7d)

### Email Configuration

#### Option 1: Mailtrap (Development - Recommended)
- [ ] Sign up at [mailtrap.io](https://mailtrap.io)
- [ ] Get SMTP credentials from inbox settings
- [ ] Set in `.env.local`:
  ```env
  SMTP_HOST=smtp.mailtrap.io
  SMTP_PORT=2525
  SMTP_USER=your-username
  SMTP_PASSWORD=your-password
  ```

#### Option 2: Gmail (Production)
- [ ] Enable 2-Factor Authentication on Google Account
- [ ] Generate App Password:
  - Go to [Google Account Security](https://myaccount.google.com/security)
  - Navigate to 2-Step Verification → App passwords
  - Generate password for "Mail"
- [ ] Set in `.env.local`:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=your-16-char-app-password
  ```

#### Option 3: SendGrid (Production)
- [ ] Sign up at [SendGrid](https://sendgrid.com)
- [ ] Create API key
- [ ] Set in `.env.local`:
  ```env
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASSWORD=your-api-key
  ```

### App Configuration
- [ ] Set `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:3000`)
- [ ] Set `APP_NAME` (default: "Legal Case Manager")
- [ ] Set `SMTP_FROM` email address

### Optional: Redis
- [ ] Install Redis (if using session storage)
- [ ] Set `REDIS_URL` in `.env.local`

## 🧪 Testing

### 1. Start Application
- [ ] Start database: `cd database && pnpm db:start`
- [ ] Start web app: `cd web && pnpm dev`
- [ ] Verify app is running at `http://localhost:3000`

### 2. Test Email Connection
```bash
cd web
node -e "require('./lib/email/config').verifyEmailConnection().then(console.log)"
```
- [ ] Email connection verified successfully

### 3. Run Test Script

**Windows:**
```powershell
cd web
.\test-auth.ps1
```

**Linux/Mac:**
```bash
cd web
chmod +x test-auth.sh
./test-auth.sh
```

- [ ] Registration test passed
- [ ] Login validation test passed
- [ ] Resend verification test passed
- [ ] Forgot password test passed
- [ ] Email enumeration protection test passed

### 4. Manual Testing

#### Registration Flow
- [ ] POST to `/api/auth/register` with valid data
- [ ] Receive success response
- [ ] Check email inbox (or Mailtrap)
- [ ] Verify email received with correct content
- [ ] Click verification link or copy token

#### Email Verification
- [ ] POST to `/api/auth/verify-email` with token
- [ ] Receive success response
- [ ] Check welcome email received

#### Login Flow
- [ ] POST to `/api/auth/login` with credentials
- [ ] Receive success response with user data
- [ ] Verify cookies are set (`access_token`, `refresh_token`)

#### Get Current User
- [ ] GET `/api/auth/me` with cookies
- [ ] Receive user data

#### Logout
- [ ] POST to `/api/auth/logout`
- [ ] Verify cookies are cleared

#### Password Reset Flow
- [ ] POST to `/api/auth/forgot-password` with email
- [ ] Check email for reset link
- [ ] POST to `/api/auth/reset-password` with token and new password
- [ ] Verify password changed email received
- [ ] Login with new password

#### Change Password
- [ ] Login first
- [ ] POST to `/api/auth/change-password` with current and new password
- [ ] Verify password changed email received
- [ ] Login with new password

## 🔒 Security Verification

- [ ] Passwords are hashed (check database - no plain text)
- [ ] JWT tokens have proper expiry
- [ ] Cookies are HttpOnly
- [ ] Cookies are SameSite=Strict
- [ ] Email enumeration protection works (consistent responses)
- [ ] Expired tokens are rejected
- [ ] Unverified users cannot login
- [ ] Tokens are cleared after use

## 📧 Email Template Verification

Check each email template:

### Verification Email
- [ ] Correct recipient name
- [ ] Working verification link
- [ ] 24-hour expiry notice
- [ ] Proper Arabic text
- [ ] Responsive design

### Password Reset Email
- [ ] Correct recipient name
- [ ] Working reset link
- [ ] 15-minute expiry notice
- [ ] Security warnings present
- [ ] Proper Arabic text

### Password Changed Email
- [ ] Correct recipient name
- [ ] Timestamp included
- [ ] Security alert present
- [ ] Proper Arabic text

### Welcome Email
- [ ] Correct recipient name
- [ ] Feature highlights present
- [ ] Dashboard link working
- [ ] Proper Arabic text

## 📝 Documentation Review

- [ ] Read `AUTH_SYSTEM_README.md`
- [ ] Review `docs/AUTH_COMPLETE.md`
- [ ] Follow `docs/QUICK_START.md`
- [ ] Check `.env.example` for all variables

## 🚀 Production Readiness

Before deploying to production:

### Security
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use production email service (SendGrid/Mailgun)
- [ ] Enable HTTPS
- [ ] Set `SMTP_SECURE=true` for port 465
- [ ] Configure proper CORS settings
- [ ] Add rate limiting middleware

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure email delivery monitoring
- [ ] Set up logging system
- [ ] Monitor failed login attempts

### Performance
- [ ] Configure Redis for sessions
- [ ] Set up email queue
- [ ] Optimize database queries
- [ ] Add caching where appropriate

### Backup
- [ ] Database backup strategy
- [ ] Environment variables backup
- [ ] Email templates version control

## 🎯 Final Verification

- [ ] All 10 API endpoints working
- [ ] All 4 email types sending correctly
- [ ] All security features active
- [ ] Documentation complete
- [ ] Test scripts working
- [ ] No TypeScript errors in auth code
- [ ] Environment variables configured
- [ ] Database schema up to date

## ✅ Sign-off

Once all items are checked:

- [ ] System is ready for development
- [ ] System is ready for testing
- [ ] System is ready for production (if production checklist complete)

---

**Date Completed:** _______________

**Completed By:** _______________

**Notes:**
_______________________________________
_______________________________________
_______________________________________

## 🆘 Troubleshooting

If any checks fail, refer to:
1. `docs/AUTH_COMPLETE.md` - Full documentation
2. `docs/QUICK_START.md` - Setup guide
3. Server logs for error details
4. Email service logs
5. Database connection status

## 📞 Support Resources

- Documentation: `advocate/web/docs/`
- Test Scripts: `advocate/web/test-auth.*`
- Environment Template: `advocate/web/.env.example`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
