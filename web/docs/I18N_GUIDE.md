# Internationalization (i18n) Guide

Complete guide for working with Arabic and English translations in the Advocate application.

## 🌍 Overview

The application supports:
- **English (en)** - Left-to-Right (LTR)
- **Arabic (ar)** - Right-to-Left (RTL)

## 📁 File Structure

```
advocate/web/
├── i18n.config.ts              # Locale configuration
├── middleware.ts               # Locale detection & routing
├── next-intl.config.ts        # next-intl setup
├── messages/
│   ├── en.json                # English translations
│   └── ar.json                # Arabic translations
├── app/
│   └── [locale]/              # Locale-based routing
│       ├── layout.tsx         # Root layout with i18n
│       └── page.tsx           # Homepage with translations
└── components/
    └── LanguageSwitcher.tsx   # Language toggle component
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `next-intl` - i18n framework for Next.js
- `@formatjs/intl-localematcher` - Locale matching
- `negotiator` - HTTP content negotiation

### 2. Run Development Server

```bash
npm run dev
```

Visit:
- `http://localhost:3000` → Redirects to `/en` or `/ar` based on browser language
- `http://localhost:3000/en` → English version
- `http://localhost:3000/ar` → Arabic version (RTL)

## 📝 Adding Translations

### Step 1: Add to Translation Files

**English (`messages/en.json`):**
```json
{
  "Navigation": {
    "home": "Home",
    "cases": "Cases",
    "clients": "Clients"
  }
}
```

**Arabic (`messages/ar.json`):**
```json
{
  "Navigation": {
    "home": "الرئيسية",
    "cases": "القضايا",
    "clients": "العملاء"
  }
}
```

### Step 2: Use in Components

**Client Component:**
```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function Navigation() {
  const t = useTranslations('Navigation');
  
  return (
    <nav>
      <a href="/">{t('home')}</a>
      <a href="/cases">{t('cases')}</a>
      <a href="/clients">{t('clients')}</a>
    </nav>
  );
}
```

**Server Component:**
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('Navigation');
  
  return <h1>{t('home')}</h1>;
}
```

## 🎨 RTL Support

### Automatic RTL

The layout automatically applies RTL for Arabic:

```tsx
// app/[locale]/layout.tsx
const direction = localeDirections[locale]; // 'rtl' for Arabic

<html lang={locale} dir={direction}>
```

### CSS for RTL

Use logical properties for better RTL support:

```css
/* ❌ Don't use */
margin-left: 10px;
padding-right: 20px;

/* ✅ Use instead */
margin-inline-start: 10px;
padding-inline-end: 20px;
```

**Tailwind CSS RTL:**
```tsx
// Automatically flips in RTL
<div className="ml-4">  {/* Becomes mr-4 in RTL */}
<div className="text-left">  {/* Becomes text-right in RTL */}
```

### Manual RTL Handling

For specific cases:

```tsx
import { useLocale } from 'next-intl';

export default function Component() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  return (
    <div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
      {/* Content */}
    </div>
  );
}
```

## 🔄 Language Switching

### Using LanguageSwitcher Component

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

### Custom Language Switcher

```tsx
'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';

export default function CustomSwitcher() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchToArabic = () => {
    const newPath = pathname.replace(`/${params.locale}`, '/ar');
    router.push(newPath);
  };
  
  return <button onClick={switchToArabic}>العربية</button>;
}
```

## 🌐 URL Structure

All routes are locale-prefixed:

```
/en                    → English homepage
/ar                    → Arabic homepage
/en/cases              → English cases page
/ar/cases              → Arabic cases page
/en/cases/[id]         → English case detail
/ar/cases/[id]         → Arabic case detail
```

### Creating New Pages

```tsx
// app/[locale]/cases/page.tsx
import { useTranslations } from 'next-intl';

export default function CasesPage() {
  const t = useTranslations('Cases');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      {/* Page content */}
    </div>
  );
}
```

Add translations:

```json
// messages/en.json
{
  "Cases": {
    "title": "All Cases"
  }
}

// messages/ar.json
{
  "Cases": {
    "title": "جميع القضايا"
  }
}
```

## 📊 Translation Organization

### Best Practices

1. **Group by Feature:**
```json
{
  "Auth": {
    "login": "Login",
    "logout": "Logout"
  },
  "Cases": {
    "create": "Create Case",
    "edit": "Edit Case"
  }
}
```

2. **Use Descriptive Keys:**
```json
// ✅ Good
{
  "Cases": {
    "createButton": "Create New Case",
    "emptyState": "No cases found"
  }
}

// ❌ Avoid
{
  "Cases": {
    "btn1": "Create New Case",
    "msg1": "No cases found"
  }
}
```

3. **Handle Plurals:**
```json
{
  "Cases": {
    "count": "{count, plural, =0 {No cases} =1 {1 case} other {# cases}}"
  }
}
```

Usage:
```tsx
t('count', { count: 5 }) // "5 cases"
```

4. **Variables in Translations:**
```json
{
  "Cases": {
    "greeting": "Welcome, {name}!"
  }
}
```

Usage:
```tsx
t('greeting', { name: 'Ahmed' }) // "Welcome, Ahmed!"
```

## 🔍 Locale Detection

The middleware detects locale in this order:

1. **URL Path** - `/ar/cases` → Arabic
2. **Accept-Language Header** - Browser preference
3. **Default Locale** - Falls back to English

### Override Detection

Force a specific locale:

```tsx
// Link to specific locale
<Link href="/ar/cases">Arabic Cases</Link>
<Link href="/en/cases">English Cases</Link>
```

## 🧪 Testing Translations

### Check Missing Translations

```bash
# Compare keys between en.json and ar.json
# Add this script to package.json:
"scripts": {
  "check-translations": "node scripts/check-translations.js"
}
```

**scripts/check-translations.js:**
```javascript
const en = require('./messages/en.json');
const ar = require('./messages/ar.json');

function compareKeys(obj1, obj2, path = '') {
  for (const key in obj1) {
    const currentPath = path ? `${path}.${key}` : key;
    if (typeof obj1[key] === 'object') {
      compareKeys(obj1[key], obj2[key] || {}, currentPath);
    } else if (!obj2[key]) {
      console.log(`Missing in Arabic: ${currentPath}`);
    }
  }
}

compareKeys(en, ar);
```

### Test RTL Layout

1. Switch to Arabic
2. Check:
   - Text alignment (right-aligned)
   - Icons and buttons (flipped)
   - Navigation (reversed)
   - Forms (labels on right)

## 🚀 Adding New Languages

### Step 1: Update Configuration

```typescript
// i18n.config.ts
export const locales = ['en', 'ar', 'fr'] as const;

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
  fr: 'ltr',
};
```

### Step 2: Create Translation File

```bash
# Copy English as template
cp messages/en.json messages/fr.json
```

### Step 3: Translate Content

Edit `messages/fr.json` with French translations.

### Step 4: Test

```bash
npm run dev
# Visit http://localhost:3000/fr
```

## 📱 Mobile Considerations

### Font Support

Ensure Arabic fonts are loaded:

```tsx
// app/[locale]/layout.tsx
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  display: 'swap',
});

<body className={cairo.className}>
```

### Input Direction

```tsx
<input
  type="text"
  dir="auto"  // Automatically detects text direction
  placeholder={t('search')}
/>
```

## 🐛 Troubleshooting

### Translations Not Showing

1. Check translation key exists in JSON
2. Verify locale is correct
3. Check browser console for errors
4. Restart dev server

### Wrong Language Detected

1. Clear browser cache
2. Check Accept-Language header
3. Manually navigate to `/en` or `/ar`

### RTL Issues

1. Use Tailwind's RTL-aware classes
2. Check `dir` attribute on `<html>`
3. Use logical CSS properties
4. Test on actual Arabic content

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Arabic Typography](https://www.arabictypography.com/)

## ✅ Checklist

Before deploying:

- [ ] All pages have translations for both languages
- [ ] RTL layout tested thoroughly
- [ ] No hardcoded text in components
- [ ] Language switcher works on all pages
- [ ] URLs are locale-prefixed
- [ ] Metadata translated (titles, descriptions)
- [ ] Forms work correctly in both directions
- [ ] Date/time formats respect locale
- [ ] Numbers formatted correctly (Arabic numerals vs Western)
