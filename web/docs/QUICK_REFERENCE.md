# Quick Reference - PWA & i18n

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🌍 i18n Quick Reference

### Use Translations (Client Component)
```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('Section');
  return <h1>{t('key')}</h1>;
}
```

### Use Translations (Server Component)
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Component() {
  const t = await getTranslations('Section');
  return <h1>{t('key')}</h1>;
}
```

### Get Current Locale
```tsx
import { useLocale } from 'next-intl';

const locale = useLocale(); // 'en' or 'ar'
const isRTL = locale === 'ar';
```

### Switch Language
```tsx
import { useRouter, usePathname, useParams } from 'next/navigation';

const router = useRouter();
const pathname = usePathname();
const params = useParams();

const switchLocale = (newLocale: string) => {
  const newPath = pathname.replace(`/${params.locale}`, `/${newLocale}`);
  router.push(newPath);
};
```

### Add Translation
```json
// messages/en.json
{
  "Section": {
    "key": "English text"
  }
}

// messages/ar.json
{
  "Section": {
    "key": "النص العربي"
  }
}
```

## 📱 PWA Quick Reference

### Check Service Worker Status
```javascript
// Browser console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs));
```

### Clear Cache
```javascript
// Browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Test Offline Mode
1. Open DevTools → Application → Service Workers
2. Check "Offline"
3. Reload page - should still work

### Update Manifest
```json
// public/manifest.json
{
  "name": "Your App Name",
  "short_name": "App",
  "theme_color": "#color"
}
```

## 🎨 RTL Styling

### Tailwind RTL-Aware Classes
```tsx
// These automatically flip in RTL:
<div className="ml-4">        {/* → mr-4 in RTL */}
<div className="text-left">   {/* → text-right in RTL */}
<div className="rounded-l">   {/* → rounded-r in RTL */}
```

### Manual RTL Handling
```tsx
const isRTL = locale === 'ar';

<div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
```

### CSS Logical Properties
```css
/* Use these instead of left/right: */
margin-inline-start: 10px;  /* instead of margin-left */
padding-inline-end: 20px;   /* instead of padding-right */
```

## 🔗 URLs

### Locale-Prefixed URLs
```
/en                → English homepage
/ar                → Arabic homepage
/en/cases          → English cases
/ar/cases          → Arabic cases
```

### Create Links
```tsx
import Link from 'next/link';

// Current locale maintained automatically
<Link href="/cases">Cases</Link>

// Specific locale
<Link href="/ar/cases">Arabic Cases</Link>
```

## 📝 Common Patterns

### Translation with Variables
```json
{
  "greeting": "Hello, {name}!"
}
```
```tsx
t('greeting', { name: 'Ahmed' }) // "Hello, Ahmed!"
```

### Plurals
```json
{
  "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```
```tsx
t('items', { count: 5 }) // "5 items"
```

### Conditional RTL Styling
```tsx
<div className={cn(
  "flex gap-4",
  isRTL && "flex-row-reverse"
)}>
```

## 🛠️ Useful Commands

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint
npm run lint

# Install dependencies
npm install

# Clear Next.js cache
rm -rf .next
```

## 📊 File Locations

```
messages/en.json              → English translations
messages/ar.json              → Arabic translations
i18n.config.ts                → Locale configuration
middleware.ts                 → Locale detection
next-intl.config.ts           → next-intl setup
public/manifest.json          → PWA manifest
public/icons/                 → PWA icons
app/[locale]/layout.tsx       → Root layout
components/LanguageSwitcher.tsx → Language switcher
```

## 🔍 Debugging

### Check Current Locale
```tsx
console.log('Current locale:', params.locale);
```

### Check Translation Loading
```tsx
console.log('Translations:', t.raw('Section'));
```

### Check Service Worker
```javascript
// Browser console
navigator.serviceWorker.controller
```

### Check Manifest
Open: `http://localhost:3000/manifest.json`

## ⚡ Performance Tips

1. **Lazy load translations** - Only load needed sections
2. **Optimize images** - Use Next.js Image component
3. **Cache static assets** - PWA handles this automatically
4. **Minimize bundle size** - Tree-shake unused code
5. **Use production build** - Always test with `npm run build`

## 🎯 Testing Checklist

- [ ] Both languages work
- [ ] RTL layout correct in Arabic
- [ ] Language switcher works
- [ ] URLs are locale-prefixed
- [ ] Service worker registers
- [ ] App installable
- [ ] Offline mode works
- [ ] Icons display correctly
- [ ] Manifest loads
- [ ] Lighthouse score 90+

## 📚 Full Documentation

- **SETUP_INSTRUCTIONS.md** - Complete setup guide
- **PWA_SETUP.md** - PWA details
- **I18N_GUIDE.md** - i18n details
- **public/icons/README.md** - Icon generation

## 🆘 Quick Fixes

### Translations not showing
```bash
npm install
npm run dev
```

### Service worker not working
```bash
npm run build
npm start
# (PWA disabled in dev mode)
```

### RTL not working
Check `<html dir="rtl">` in Arabic pages

### Icons missing
Generate icons in `public/icons/` folder
