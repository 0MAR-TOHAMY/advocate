# Quick Start Guide - Authentication System

## 🚀 Setup (5 minutes)

### 1. Install Dependencies
```bash
cd advocate
pnpm install
```

### 2. Configure Environment Variables
```bash
cd web
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
# Database
DATABASE_URL=postgresql://root:root@localhost:5432/legal_case_manager

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=noreply@legalcase.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Gmail App Password Setup
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate password for "Mail" app
5. Copy the 16-character password to `SMTP_PASSWORD`

### 4. Start the Application
```bash
# Terminal 1: Start database
cd advocate/database
pnpm db:start

# Terminal 2: Start web app
cd advocate/web
pnpm dev
```

## 📧 Test Email Functionality

### Option 1: Use Mailtrap (Development)
Free email testing service - no real emails sent

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```

Sign up at [mailtrap.io](https://mailtrap.io)

### Option 2: Use Gmail (Production)
Follow Gmail setup above

### Option 3: Use SendGrid (Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## 🧪 Test the System

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test1234",
    "firmId": "firm_1"
  }'
```

### 2. Check Email
- Check your email inbox (or Mailtrap)
- Copy the verification token from the URL

### 3. Verify Email
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

### 4. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## 📋 Available Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/verify-email` | POST | Verify email with token |
| `/api/auth/resend-verification` | POST | Resend verification email |
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/change-password` | POST | Change password (authenticated) |

## 🔧 Troubleshooting

### Email Not Sending
```bash
# Check SMTP connection
node -e "require('./lib/email/config').verifyEmailConnection().then(console.log)"
```

### Common Issues

**"Cannot find module 'nodemailer'"**
```bash
pnpm install
```

**"Invalid SMTP credentials"**
- Check `SMTP_USER` and `SMTP_PASSWORD`
- For Gmail, use App Password, not regular password

**"Connection timeout"**
- Check firewall settings
- Verify `SMTP_HOST` and `SMTP_PORT`

**"Token expired"**
- Verification token: 24 hours
- Reset token: 15 minutes
- Request new token using resend endpoints

## 📚 Next Steps

1. Read [AUTH_COMPLETE.md](./AUTH_COMPLETE.md) for full documentation
2. Customize email templates in `lib/email/templates.ts`
3. Add rate limiting for production
4. Set up Redis for session management
5. Configure monitoring and logging

## 🎯 Production Deployment

Before deploying to production:

1. **Change JWT Secret**
   ```bash
   # Generate secure random string
   openssl rand -base64 32
   ```

2. **Use Production Email Service**
   - SendGrid, Mailgun, or AWS SES
   - Set up domain authentication
   - Configure SPF/DKIM records

3. **Enable HTTPS**
   - Update `NEXT_PUBLIC_APP_URL` to https://
   - Set `SMTP_SECURE=true` if using port 465

4. **Add Rate Limiting**
   - Protect login endpoint
   - Limit password reset requests
   - Throttle email sending

5. **Set Up Monitoring**
   - Email delivery tracking
   - Error logging
   - Performance monitoring

## 💡 Tips

- Use Mailtrap for development (no real emails)
- Test all flows before production
- Keep email templates professional
- Monitor email delivery rates
- Set up email queue for reliability

## 🆘 Support

If you encounter issues:
1. Check environment variables
2. Verify database connection
3. Test email configuration
4. Review server logs
5. Check [AUTH_COMPLETE.md](./AUTH_COMPLETE.md)
