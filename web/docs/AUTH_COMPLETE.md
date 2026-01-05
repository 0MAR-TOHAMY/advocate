# Complete Authentication System Documentation

## Overview

This is a complete, production-ready authentication system with email verification, password reset, and session management for the Legal Case Manager application.

## Features

✅ **User Registration** with email verification
✅ **Email Verification** with token-based confirmation
✅ **Login/Logout** with JWT tokens
✅ **Password Reset** via email
✅ **Change Password** for authenticated users
✅ **Resend Verification Email**
✅ **Session Management** with Redis (optional)
✅ **Email Templates** in Arabic with beautiful HTML design
✅ **Security Best Practices** implemented

## API Routes

### 1. Register User
**POST** `/api/auth/register`

Creates a new user account and sends verification email.

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "phone": "+201234567890",
  "department": "القسم القانوني",
  "position": "محامي",
  "firmId": "firm_123"
}
```

**Response (201):**
```json
{
  "message": "تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني",
  "user": {
    "id": "user_123",
    "email": "ahmed@example.com",
    "name": "أحمد محمد"
  }
}
```

### 2. Verify Email
**POST** `/api/auth/verify-email`

Verifies user email with token from email link.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response (200):**
```json
{
  "message": "تم التحقق من البريد الإلكتروني بنجاح",
  "user": {
    "id": "user_123",
    "email": "ahmed@example.com",
    "name": "أحمد محمد"
  }
}
```

### 3. Resend Verification Email
**POST** `/api/auth/resend-verification`

Resends verification email to user.

**Request Body:**
```json
{
  "email": "ahmed@example.com"
}
```

**Response (200):**
```json
{
  "message": "تم إرسال رابط التحقق إلى بريدك الإلكتروني"
}
```

### 4. Login
**POST** `/api/auth/login`

Authenticates user and returns JWT tokens.

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "تم تسجيل الدخول بنجاح",
  "user": {
    "id": "user_123",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "user",
    "firmId": "firm_123"
  }
}
```

**Sets Cookies:**
- `access_token` (15 minutes)
- `refresh_token` (7 days)

### 5. Logout
**POST** `/api/auth/logout`

Logs out user and clears tokens.

**Response (200):**
```json
{
  "message": "تم تسجيل الخروج بنجاح"
}
```

### 6. Refresh Token
**POST** `/api/auth/refresh`

Refreshes access token using refresh token.

**Response (200):**
```json
{
  "message": "تم تحديث الرمز بنجاح"
}
```

### 7. Get Current User
**GET** `/api/auth/me`

Returns current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "user",
    "firmId": "firm_123",
    "isVerified": true,
    "isActive": true
  }
}
```

### 8. Forgot Password
**POST** `/api/auth/forgot-password`

Sends password reset email.

**Request Body:**
```json
{
  "email": "ahmed@example.com"
}
```

**Response (200):**
```json
{
  "message": "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

### 9. Reset Password
**POST** `/api/auth/reset-password`

Resets password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123"
}
```

**Response (200):**
```json
{
  "message": "تم إعادة تعيين كلمة المرور بنجاح"
}
```

### 10. Change Password
**POST** `/api/auth/change-password`

Changes password for authenticated user.

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass123"
}
```

**Response (200):**
```json
{
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

## Email Configuration

### Environment Variables

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@legalcase.com

# App Configuration
APP_NAME=Legal Case Manager
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gmail Setup

1. Enable 2-Factor Authentication in your Google Account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated password
3. Use the app password in `SMTP_PASSWORD`

### Other Email Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_password
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
```

## Email Templates

All email templates are in Arabic with beautiful HTML design:

1. **Verification Email** - Sent on registration
2. **Password Reset Email** - Sent on forgot password
3. **Password Changed Email** - Sent after password change
4. **Welcome Email** - Sent after email verification

Templates include:
- Responsive design
- RTL support for Arabic
- Gradient headers
- Clear call-to-action buttons
- Security warnings
- Plain text fallback

## Security Features

### Password Security
- Minimum 8 characters
- Hashed with bcryptjs (10 salt rounds)
- Never stored in plain text

### Token Security
- **Verification Token**: 32-byte random hex (24-hour expiry)
- **Reset Token**: 32-byte random hex (15-minute expiry)
- **Access Token**: JWT (15-minute expiry)
- **Refresh Token**: JWT (7-day expiry)

### Protection Against
- ✅ Email enumeration (consistent responses)
- ✅ Brute force attacks (token expiry)
- ✅ Token reuse (cleared after use)
- ✅ CSRF attacks (SameSite cookies)
- ✅ XSS attacks (HttpOnly cookies)

### Rate Limiting (Recommended)
Add rate limiting middleware for:
- Login attempts: 5 per 15 minutes
- Password reset: 3 per hour
- Email resend: 3 per hour

## Database Schema

```typescript
users {
  id: string (PK)
  email: string (unique, indexed)
  passwordHash: string
  name: string
  
  // Verification
  isVerified: boolean
  verificationToken: string (indexed)
  verificationExpiresAt: timestamp
  
  // Password Reset
  resetToken: string (indexed)
  resetTokenExpiresAt: timestamp
  
  // Account Status
  isActive: boolean
  role: string
  
  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
  lastLoginAt: timestamp
}
```

## Testing

### Manual Testing

1. **Register Flow:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"Test1234","firmId":"firm_1"}'
   ```

2. **Verify Email:**
   - Check email inbox
   - Click verification link or use token
   ```bash
   curl -X POST http://localhost:3000/api/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_FROM_EMAIL"}'
   ```

3. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234"}'
   ```

4. **Forgot Password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

5. **Reset Password:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_FROM_EMAIL","password":"NewPass1234"}'
   ```

## Installation

1. **Install dependencies:**
   ```bash
   cd advocate
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp web/.env.example web/.env.local
   # Edit .env.local with your values
   ```

3. **Run database migrations:**
   ```bash
   cd database
   pnpm db:push
   ```

4. **Start development server:**
   ```bash
   cd web
   pnpm dev
   ```

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials:**
   ```bash
   # Test email connection
   node -e "require('./lib/email/config').verifyEmailConnection()"
   ```

2. **Common issues:**
   - Gmail: Enable "Less secure app access" or use App Password
   - Firewall: Ensure port 587 is open
   - Environment variables: Check they're loaded correctly

### Token Expired

- Verification token: Valid for 24 hours
- Reset token: Valid for 15 minutes
- Request new token using resend endpoints

### User Not Verified

- Check email spam folder
- Use resend verification endpoint
- Manually verify in database (development only)

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set up production email service (SendGrid/Mailgun/SES)
- [ ] Enable HTTPS
- [ ] Set `SMTP_SECURE=true` for port 465
- [ ] Configure proper CORS settings
- [ ] Add rate limiting middleware
- [ ] Set up monitoring and logging
- [ ] Configure Redis for session storage
- [ ] Set up email delivery monitoring
- [ ] Add email queue for reliability
- [ ] Configure proper error tracking

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test email configuration
4. Verify database schema
5. Check environment variables

## License

Proprietary - Legal Case Manager
