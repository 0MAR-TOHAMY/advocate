# 🚀 Complete Implementation Guide

## Overview

This guide covers the complete implementation of:
1. **Google OAuth Authentication**
2. **Cloudinary Image Upload** (Avatar & Cover)
3. **Bilingual Auth Pages** (Arabic & English)
4. **Profile Management**

---

## 📦 What Was Implemented

### 1. Google OAuth Integration

**Files Created:**
- `lib/auth/google.ts` - Google OAuth configuration and utilities
- `app/api/auth/google/url/route.ts` - Generate OAuth URL
- `app/api/auth/google/callback/route.ts` - Handle OAuth callback

**Database Changes:**
- Added `googleId` field to users table
- Added index on `googleId`

**Features:**
- Sign in with Google
- Auto-create user on first Google login
- Link Google account to existing email
- Pre-verified Google accounts

### 2. Cloudinary Image Upload

**Files Created:**
- `lib/cloudinary/config.ts` - Cloudinary configuration
- `lib/cloudinary/upload.ts` - Upload utilities (avatar, cover, delete)
- `app/api/upload/avatar/route.ts` - Avatar upload API
- `app/api/upload/cover/route.ts` - Cover upload API

**Features:**
- Upload avatar (400x400, face detection)
- Upload cover (1200x400)
- Auto-optimization (quality, format)
- Delete old images on new upload
- Secure authenticated uploads

### 3. Bilingual System (Arabic/English)

**Files Created:**
- `lib/i18n/translations.ts` - Complete translations
- `lib/i18n/useTranslation.ts` - Translation hook
- `lib/i18n/index.ts` - Exports

**Translations Include:**
- Auth pages (login, register, forgot-password, reset-password, verify-email)
- Profile page
- Common UI elements
- Error messages

### 4. UI Components

**Files Created:**
- `components/ui/Input.tsx` - Text input with error display
- `components/ui/Button.tsx` - Button with loading state
- `components/ui/PasswordInput.tsx` - Password with show/hide toggle
- `components/ui/FormGroup.tsx` - Form field wrapper
- `components/ui/Checkbox.tsx` - Styled checkbox
- `components/ui/ImageUpload.tsx` - Drag-drop image upload

**Design:**
- Based on auth-user-master reference
- Clean, modern UI
- RTL support for Arabic
- Responsive design

### 5. Auth Pages (Bilingual)

**Files Created:**
- `app/[lang]/(auth)/login/page.tsx`
- `app/[lang]/(auth)/register/page.tsx`
- `app/[lang]/(auth)/forgot-password/page.tsx`
- `app/[lang]/(auth)/reset-password/page.tsx`
- `app/[lang]/(auth)/verify-email/page.tsx`

**Features:**
- Full Arabic/English support
- Google OAuth button
- Form validation
- Error/success messages
- Responsive design

### 6. Profile Page

**Files Created:**
- `app/[lang]//profile/page.tsx`
- `app/api/user/profile/route.ts`

**Features:**
- Upload/remove avatar
- Upload/remove cover
- Edit personal info (name, phone, department, position)
- Bilingual interface
- Real-time preview

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd advocate
pnpm install
```

**New Dependencies Added:**
- `cloudinary` - Image upload service
- `googleapis` - Google OAuth
- `lucide-react` - Icons
- `react-dropzone` - Drag-drop upload

### 2. Update Database Schema

```bash
cd database
pnpm db:push
```

**Schema Changes:**
- Added `googleId` field
- Added `googleId` index

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cd web
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=legal_case_manager
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env.local`

### 5. Set Up Cloudinary

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Create upload preset:
   - Settings → Upload → Upload presets
   - Add upload preset: `legal_case_manager`
   - Mode: Unsigned (or Signed for more security)

### 6. Start the Application

```bash
# Terminal 1: Database
cd advocate/database
pnpm db:start

# Terminal 2: Redis (optional)
cd advocate/tokens
npm run db:start

# Terminal 3: Web App
cd advocate/web
pnpm dev
```

---

## 🎯 Usage

### Access Auth Pages

**Arabic (Default):**
- Login: `http://localhost:3000/ar/login`
- Register: `http://localhost:3000/ar/register`
- Forgot Password: `http://localhost:3000/ar/forgot-password`

**English:**
- Login: `http://localhost:3000/en/login`
- Register: `http://localhost:3000/en/register`
- Forgot Password: `http://localhost:3000/en/forgot-password`

### Google OAuth Flow

1. Click "Login with Google" button
2. Redirected to Google consent screen
3. Authorize the application
4. Redirected back to app (auto-login)
5. If email exists: link Google account
6. If new user: create account

### Upload Images

**Avatar:**
```typescript
// In profile page
<ImageUpload
  type="avatar"
  currentImage={profile?.avatarUrl}
  onUpload={handleAvatarUpload}
  onRemove={handleAvatarRemove}
/>
```

**Cover:**
```typescript
<ImageUpload
  type="cover"
  currentImage={profile?.coverUrl}
  onUpload={handleCoverUpload}
  onRemove={handleCoverRemove}
/>
```

### API Endpoints

**Google OAuth:**
- `GET /api/auth/google/url` - Get OAuth URL
- `GET /api/auth/google/callback` - Handle callback

**Image Upload:**
- `POST /api/upload/avatar` - Upload avatar
- `DELETE /api/upload/avatar` - Delete avatar
- `POST /api/upload/cover` - Upload cover
- `DELETE /api/upload/cover` - Delete cover

**Profile:**
- `PATCH /api/user/profile` - Update profile

---

## 📝 Code Examples

### Using Translations

```typescript
import { useTranslation } from "@/lib/i18n";

function MyComponent() {
  const { t, lang, dir } = useTranslation();
  
  return (
    <div dir={dir}>
      <h1>{t.auth.login.title}</h1>
      <p>{t.auth.login.subtitle}</p>
    </div>
  );
}
```

### Upload Image to Cloudinary

```typescript
import { uploadAvatar } from "@/lib/cloudinary";

async function handleUpload(file: File) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  
  reader.onload = async () => {
    const result = await uploadAvatar(reader.result as string, userId);
    console.log("Uploaded:", result.secureUrl);
  };
}
```

### Google OAuth in Backend

```typescript
import { getGoogleUserInfo } from "@/lib/auth/google";

const googleUser = await getGoogleUserInfo(code);
// googleUser: { googleId, email, name, picture, verified }
```

---

## 🔒 Security Features

### Google OAuth
- ✅ Secure token exchange
- ✅ State parameter for CSRF protection
- ✅ Verified email from Google
- ✅ Automatic account linking

### Image Upload
- ✅ Authenticated uploads only
- ✅ File size limits (5MB)
- ✅ File type validation
- ✅ Automatic optimization
- ✅ Secure Cloudinary storage

### Auth Pages
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Input validation
- ✅ Secure password handling
- ✅ Rate limiting ready

---

## 🎨 UI/UX Features

### Design
- Clean, modern interface
- Consistent with auth-user-master design
- Smooth transitions and animations
- Loading states
- Error/success feedback

### Accessibility
- RTL support for Arabic
- Keyboard navigation
- Screen reader friendly
- High contrast
- Focus indicators

### Responsive
- Mobile-first design
- Tablet optimized
- Desktop enhanced
- Touch-friendly

---

## 🧪 Testing

### Test Google OAuth

1. Click "Login with Google"
2. Use test Google account
3. Verify auto-login
4. Check database for `googleId`

### Test Image Upload

1. Go to profile page
2. Drag-drop image or click to browse
3. Verify upload progress
4. Check Cloudinary dashboard
5. Verify database `avatarUrl`/`coverUrl`

### Test Bilingual

1. Visit `/ar/login` (Arabic)
2. Visit `/en/login` (English)
3. Verify text direction (RTL/LTR)
4. Verify translations

---

## 📊 Database Schema

```sql
-- Added to users table
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
CREATE INDEX users_google_id_idx ON users(google_id);
```

---

## 🚨 Troubleshooting

### Google OAuth Not Working

**Issue:** "redirect_uri_mismatch"
**Solution:** Ensure redirect URI in Google Console matches exactly:
```
http://localhost:3000/api/auth/google/callback
```

**Issue:** "invalid_client"
**Solution:** Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

### Cloudinary Upload Fails

**Issue:** "Invalid credentials"
**Solution:** Verify Cloudinary credentials in `.env.local`

**Issue:** "Upload preset not found"
**Solution:** Create upload preset in Cloudinary dashboard

### Translations Not Working

**Issue:** All text in Arabic
**Solution:** Access pages with `/en/` prefix for English

**Issue:** "useTranslation is not exported"
**Solution:** Run `pnpm install` to resolve dependencies

---

## 📚 Additional Resources

### Google OAuth
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

### Cloudinary
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformations](https://cloudinary.com/documentation/image_transformations)

### Next.js
- [App Router](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

## ✅ Checklist

- [ ] Dependencies installed (`pnpm install`)
- [ ] Database schema updated (`pnpm db:push`)
- [ ] Google OAuth configured
- [ ] Cloudinary configured
- [ ] Environment variables set
- [ ] Application running
- [ ] Google login tested
- [ ] Image upload tested
- [ ] Both languages tested
- [ ] Profile page working

---

## 🎉 What's Next?

### Recommended Enhancements

1. **OAuth Providers**
   - Add Microsoft OAuth
   - Add Facebook OAuth
   - Add Apple Sign In

2. **Image Features**
   - Image cropping tool
   - Multiple image upload
   - Image filters
   - Bulk upload

3. **Localization**
   - Add more languages
   - Dynamic language switching
   - User language preference
   - Browser language detection

4. **Profile Features**
   - Profile completion progress
   - Profile visibility settings
   - Profile sharing
   - QR code generation

5. **Security**
   - Two-factor authentication
   - Login history
   - Device management
   - Session management

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review environment variables
3. Check browser console
4. Check server logs
5. Verify API responses

---

**Implementation Date:** November 17, 2025  
**Status:** ✅ Complete and Ready for Testing
