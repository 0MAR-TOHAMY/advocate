# Deployment Checklist

Use this checklist to ensure everything is ready before deploying your application.

## 📋 Pre-Deployment Checklist

### 1. Dependencies
- [ ] Run `npm install` to install all dependencies
- [ ] Verify `next-intl`, `next-pwa`, and other packages are installed
- [ ] Check for any security vulnerabilities: `npm audit`
- [ ] Update outdated packages if needed: `npm update`

### 2. PWA Icons
- [ ] Generate all required icon sizes (see `public/icons/README.md`)
  - [ ] icon-72x72.png
  - [ ] icon-96x96.png
  - [ ] icon-128x128.png
  - [ ] icon-144x144.png
  - [ ] icon-152x152.png
  - [ ] icon-192x192.png
  - [ ] icon-384x384.png
  - [ ] icon-512x512.png
- [ ] Place icons in `public/icons/` folder
- [ ] Verify icons display correctly in browser

### 3. PWA Manifest
- [ ] Update `public/manifest.json` with your app details:
  - [ ] App name
  - [ ] Short name
  - [ ] Description
  - [ ] Theme color
  - [ ] Background color
  - [ ] Start URL
- [ ] Verify manifest loads: `http://localhost:3000/manifest.json`

### 4. Translations
- [ ] Review and customize `messages/en.json`
- [ ] Review and customize `messages/ar.json`
- [ ] Ensure all keys exist in both files
- [ ] Test all translations display correctly
- [ ] Verify no hardcoded text in components

### 5. Metadata & SEO
- [ ] Update metadata in `app/[locale]/layout.tsx`:
  - [ ] Title
  - [ ] Description
  - [ ] Keywords
  - [ ] Author
  - [ ] Open Graph tags
  - [ ] Twitter card
  - [ ] Domain URL
- [ ] Add favicon.ico
- [ ] Add og-image.png for social sharing
- [ ] Add robots.txt if needed

### 6. Styling & UI
- [ ] Test responsive design on mobile, tablet, desktop
- [ ] Verify RTL layout works correctly in Arabic
- [ ] Check all Tailwind classes are RTL-aware
- [ ] Test dark mode (if implemented)
- [ ] Verify all images have alt text
- [ ] Check loading states and error messages

### 7. Functionality Testing
- [ ] Test language switcher on all pages
- [ ] Verify automatic locale detection works
- [ ] Test all routes in both English and Arabic
- [ ] Check navigation works correctly
- [ ] Test forms (if any) in both languages
- [ ] Verify API calls work (if any)

### 8. PWA Testing
- [ ] Build production version: `npm run build`
- [ ] Start production server: `npm start`
- [ ] Open Chrome DevTools → Application tab
- [ ] Verify Service Worker registers successfully
- [ ] Test offline mode:
  - [ ] Enable offline in DevTools
  - [ ] Reload page - should still work
  - [ ] Navigate between pages offline
- [ ] Test install prompt:
  - [ ] Install app to home screen
  - [ ] Verify app opens in standalone mode
  - [ ] Check app icon displays correctly
- [ ] Run Lighthouse audit:
  - [ ] PWA score 90+
  - [ ] Performance score 90+
  - [ ] Accessibility score 90+
  - [ ] Best Practices score 90+
  - [ ] SEO score 90+

### 9. Browser Testing
- [ ] Test on Chrome/Edge (Chromium)
- [ ] Test on Firefox
- [ ] Test on Safari (macOS/iOS)
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)
- [ ] Verify PWA works on all browsers
- [ ] Check RTL layout on all browsers

### 10. Performance
- [ ] Optimize images (use WebP format)
- [ ] Minimize bundle size
- [ ] Enable compression
- [ ] Check Core Web Vitals
- [ ] Test loading speed
- [ ] Verify caching works correctly

### 11. Security
- [ ] Enable HTTPS (required for PWA)
- [ ] Set up security headers
- [ ] Configure CORS if needed
- [ ] Review environment variables
- [ ] Check for exposed secrets
- [ ] Enable CSP (Content Security Policy)

### 12. Environment Setup
- [ ] Set up production environment variables
- [ ] Configure database connection (if applicable)
- [ ] Set up API endpoints
- [ ] Configure CDN (if using)
- [ ] Set up monitoring/analytics

### 13. Documentation
- [ ] Update README.md with project-specific info
- [ ] Document API endpoints (if any)
- [ ] Add deployment instructions
- [ ] Document environment variables
- [ ] Create user guide (if needed)

### 14. Git & Version Control
- [ ] Commit all changes
- [ ] Push to remote repository
- [ ] Tag release version
- [ ] Update .gitignore
- [ ] Remove sensitive data from git history

### 15. Deployment Platform
- [ ] Choose deployment platform (Vercel, Netlify, etc.)
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
  - [ ] Install command: `npm install`
  - [ ] Node version: 18+
- [ ] Set up custom domain
- [ ] Configure DNS settings
- [ ] Enable HTTPS/SSL
- [ ] Set up automatic deployments

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Option 3: Custom Server

```bash
# Build the application
npm run build

# Upload files to server:
# - .next folder
# - public folder
# - package.json
# - package-lock.json
# - node_modules (or run npm install on server)

# On server, run:
npm install --production
npm start
```

## ✅ Post-Deployment Checklist

### 1. Verification
- [ ] Visit production URL
- [ ] Test automatic redirect to locale
- [ ] Test both `/en` and `/ar` routes
- [ ] Verify language switcher works
- [ ] Check RTL layout in Arabic
- [ ] Test PWA installation
- [ ] Verify offline mode works
- [ ] Check all pages load correctly

### 2. Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics (Google Analytics, etc.)
- [ ] Set up uptime monitoring
- [ ] Monitor performance metrics
- [ ] Check server logs

### 3. SEO
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt is accessible
- [ ] Check meta tags are correct
- [ ] Test social media sharing
- [ ] Verify structured data (if any)

### 4. Performance
- [ ] Run Lighthouse audit on production
- [ ] Check PageSpeed Insights score
- [ ] Verify CDN is working (if using)
- [ ] Test loading speed from different locations
- [ ] Monitor Core Web Vitals

### 5. Security
- [ ] Run security audit
- [ ] Check SSL certificate
- [ ] Verify security headers
- [ ] Test CORS configuration
- [ ] Review access logs

### 6. Backup
- [ ] Set up automated backups
- [ ] Document rollback procedure
- [ ] Test backup restoration
- [ ] Keep previous version accessible

## 🐛 Common Issues & Solutions

### Service Worker Not Registering
- Ensure HTTPS is enabled
- Check browser console for errors
- Verify manifest.json is valid
- Clear browser cache and reload

### Translations Not Loading
- Check translation files exist
- Verify JSON syntax is correct
- Ensure locale is correctly detected
- Check browser console for errors

### RTL Layout Issues
- Verify `dir="rtl"` is set on `<html>`
- Use Tailwind RTL-aware classes
- Check for hardcoded left/right CSS
- Test with actual Arabic content

### Icons Not Displaying
- Verify icons exist in `public/icons/`
- Check icon paths in manifest.json
- Clear browser cache
- Regenerate icons if needed

### Build Errors
- Run `npm install` to ensure all dependencies
- Check for TypeScript errors
- Verify all imports are correct
- Clear `.next` folder and rebuild

## 📊 Success Metrics

After deployment, monitor these metrics:

- [ ] Lighthouse PWA score: 90+
- [ ] Lighthouse Performance: 90+
- [ ] Lighthouse Accessibility: 90+
- [ ] Page load time: < 3 seconds
- [ ] Time to Interactive: < 5 seconds
- [ ] First Contentful Paint: < 1.5 seconds
- [ ] Cumulative Layout Shift: < 0.1
- [ ] Install rate: Track PWA installations
- [ ] Offline usage: Monitor offline sessions
- [ ] Language distribution: Track en vs ar usage

## 🎉 Launch!

Once all items are checked:

1. ✅ Run final tests
2. ✅ Deploy to production
3. ✅ Verify everything works
4. ✅ Monitor for issues
5. ✅ Celebrate! 🎊

---

## 📝 Notes

- Keep this checklist updated as you add features
- Review before each deployment
- Share with team members
- Document any custom steps specific to your project

## 🆘 Need Help?

Refer to:
- **SETUP_INSTRUCTIONS.md** - Setup guide
- **PWA_SETUP.md** - PWA details
- **I18N_GUIDE.md** - i18n details
- **QUICK_REFERENCE.md** - Quick commands

Good luck with your deployment! 🚀
