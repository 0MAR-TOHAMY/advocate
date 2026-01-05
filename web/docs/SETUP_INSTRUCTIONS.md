# Setup Instructions - PWA & i18n

Complete setup guide for the Advocate application with PWA and internationalization support.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git (optional)

## 🚀 Installation

### 1. Install Dependencies

```bash
cd advocate/web
npm install
```

This will install all required packages including:
- `next-intl` - Internationalization
- `next-pwa` - Progressive Web App support
- `negotiator` - Language negotiation
- And all other dependencies

### 2. Verify Installation

Check that all packages are installed:

```bash
npm list next-intl next-pwa
```

## 🎨 Generate PWA Icons

Before running the app, you need to generate PWA icons:

### Option 1: Using Online Tool (Easiest)

1. Visit https://realfavicongenerator.net/
2. Upload your logo (512x512 PNG recommended)
3. Download the generated icons
4. Extract and place them in `public/icons/`

### Option 2: Using Command Line

```bash
# Install pwa-asset-generator globally
npm install -g pwa-asset-generator

# Generate icons from your logo
npx pwa-asset-generator public/logo.png public/icons --icon-only --padding "10%"
```

### Option 3: Manual Creation

Create these icon sizes in `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

See `public/icons/README.md` for detailed instructions.

## 🌍 Configure Internationalization

### Translation Files

The app comes with default English and Arabic translations in:
- `messages/en.json` - English
- `messages/ar.json` - Arabic

**Customize these files** with your own translations:

```json
// messages/en.json
{
  "Home": {
    "title": "Your Custom Title",
    "description": "Your custom description"
  }
}

// messages/ar.json
{
  "Home": {
    "title": "عنوانك المخصص",
    "description": "وصفك المخصص"
  }
}
```

### Supported Languages

Default languages:
- English (en) - LTR
- Arabic (ar) - RTL

To add more languages, see `I18N_GUIDE.md`.

## 📱 Configure PWA

### 1. Update Manifest

Edit `public/manifest.json` with your app details:

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "description": "Your app description",
  "start_url": "/",
  "theme_color": "#your-color"
}
```

### 2. Update Metadata

Edit `app/[locale]/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: "Your App Title",
  description: "Your app description",
  metadataBase: new URL("https://your-domain.com"),
  // ... other metadata
};
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Visit:
- http://localhost:3000 (auto-redirects to /en or /ar)
- http://localhost:3000/en (English)
- http://localhost:3000/ar (Arabic)

**Note:** PWA features are disabled in development mode.

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

Visit http://localhost:3000

## ✅ Testing

### Test i18n

1. Visit http://localhost:3000
2. Should redirect to /en or /ar based on browser language
3. Click language switcher to toggle between English/Arabic
4. Verify RTL layout works correctly in Arabic
5. Check that all text is translated

### Test PWA

1. Build and run in production mode:
```bash
npm run build
npm start
```

2. Open Chrome DevTools → Application tab
3. Check:
   - ✅ Manifest loaded correctly
   - ✅ Service Worker registered
   - ✅ Icons present
   - ✅ Offline mode works

4. Test installation:
   - Click install button in browser
   - App should install to home screen

### Run Lighthouse Audit

1. Open Chrome DevTools → Lighthouse
2. Select "Progressive Web App"
3. Click "Generate report"
4. Aim for score 90+

## 🐛 Troubleshooting

### Lint Errors About Missing Modules

The TypeScript errors about `next-intl` and `next-pwa` are expected before running `npm install`. They will disappear after installation.

```bash
# Fix by installing dependencies
npm install
```

### Service Worker Not Registering

1. Ensure you're running in production mode
2. Check HTTPS is enabled (or using localhost)
3. Clear browser cache and reload
4. Check browser console for errors

### Translations Not Showing

1. Verify translation files exist in `messages/` folder
2. Check translation keys match in both en.json and ar.json
3. Restart dev server
4. Clear browser cache

### Icons Not Loading

1. Verify icons exist in `public/icons/` folder
2. Check icon filenames match manifest.json
3. Regenerate icons if needed
4. Clear browser cache

### RTL Layout Issues

1. Check `dir` attribute on `<html>` tag
2. Use Tailwind's RTL-aware classes
3. Test with actual Arabic content
4. Use logical CSS properties (margin-inline-start vs margin-left)

## 📁 Project Structure

```
advocate/web/
├── app/
│   ├── [locale]/              # Locale-based routing
│   │   ├── layout.tsx         # Root layout with i18n
│   │   └── page.tsx           # Homepage
│   ├── favicon.ico
│   └── globals.css
├── components/
│   └── LanguageSwitcher.tsx   # Language toggle
├── messages/
│   ├── en.json                # English translations
│   └── ar.json                # Arabic translations
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.json          # PWA manifest
│   └── logo.png
├── i18n.config.ts             # i18n configuration
├── middleware.ts              # Locale detection
├── next-intl.config.ts        # next-intl setup
├── next.config.ts             # Next.js + PWA config
├── package.json
├── PWA_SETUP.md               # PWA documentation
├── I18N_GUIDE.md              # i18n documentation
└── SETUP_INSTRUCTIONS.md      # This file
```

## 🚢 Deployment

### Before Deploying

- [ ] Generate all PWA icons
- [ ] Update manifest.json with your app details
- [ ] Update metadata in layout.tsx
- [ ] Customize translations in messages/
- [ ] Test PWA features in production mode
- [ ] Run Lighthouse audit
- [ ] Ensure HTTPS is enabled

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms

1. Build the application:
```bash
npm run build
```

2. Upload the `.next` folder and `public` folder
3. Set Node.js version to 18+
4. Run `npm start` as start command
5. Ensure HTTPS is enabled

### Environment Variables

No environment variables required for basic setup.

For production, you may want to add:
- `NEXT_PUBLIC_APP_URL` - Your app URL
- `NEXT_PUBLIC_API_URL` - Your API URL

## 📚 Documentation

- **PWA_SETUP.md** - Complete PWA guide
- **I18N_GUIDE.md** - Complete i18n guide
- **public/icons/README.md** - Icon generation guide

## 🎯 Next Steps

1. **Customize Translations**
   - Edit `messages/en.json` and `messages/ar.json`
   - Add more translation keys as needed

2. **Add More Pages**
   - Create pages in `app/[locale]/your-page/page.tsx`
   - Add translations for new pages

3. **Customize Styling**
   - Edit `app/globals.css`
   - Use Tailwind classes
   - Ensure RTL compatibility

4. **Add Features**
   - Authentication
   - Database integration
   - API routes
   - More...

## 💡 Tips

1. **Always test in both languages** - Don't just test in English
2. **Use RTL-aware CSS** - Avoid hardcoded left/right values
3. **Test offline mode** - PWA should work without internet
4. **Keep translations in sync** - Both languages should have same keys
5. **Test on real devices** - Mobile experience matters

## 🆘 Getting Help

If you encounter issues:

1. Check the documentation:
   - PWA_SETUP.md
   - I18N_GUIDE.md
   - public/icons/README.md

2. Check browser console for errors

3. Verify all dependencies are installed:
```bash
npm install
```

4. Clear cache and rebuild:
```bash
rm -rf .next
npm run build
```

5. Check Next.js documentation:
   - https://nextjs.org/docs
   - https://next-intl-docs.vercel.app/
   - https://github.com/shadowwalker/next-pwa

## ✨ Features Included

✅ **Progressive Web App (PWA)**
- Installable on mobile and desktop
- Offline support
- App-like experience
- Push notification ready

✅ **Internationalization (i18n)**
- English and Arabic support
- RTL layout for Arabic
- Easy language switching
- URL-based locale routing

✅ **Modern Stack**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

✅ **Production Ready**
- Optimized caching strategies
- SEO friendly
- Performance optimized
- Mobile responsive

## 🎉 You're All Set!

Your application is now configured with:
- ✅ PWA support
- ✅ English/Arabic i18n
- ✅ RTL layout
- ✅ Offline capabilities
- ✅ Modern development stack

Start building your legal case management system! 🚀
