# Project Structure

This document describes the organized folder structure of the Advocate web application.

## 📁 Directory Organization

```
advocate/web/
├── app/                        # Next.js App Router
│   └── [locale]/              # Locale-based routing
│       ├── layout.tsx         # Root layout with i18n
│       └── page.tsx           # Homepage
│
├── components/                 # React components
│   └── LanguageSwitcher.tsx   # Language toggle component
│
├── docs/                       # 📚 Documentation files
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── I18N_GUIDE.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── PROJECT_STRUCTURE.md   # This file
│   ├── PWA_SETUP.md
│   ├── QUICK_REFERENCE.md
│   └── SETUP_INSTRUCTIONS.md
│
├── lib/                        # 🔧 Library code and utilities
│   └── config/                # Configuration files
│       ├── i18n.config.ts     # Locale configuration
│       └── next-intl.config.ts # next-intl setup
│
├── messages/                   # 🌍 Translation files
│   ├── en.json                # English translations
│   └── ar.json                # Arabic translations
│
├── public/                     # Static assets
│   ├── icons/                 # PWA icons
│   └── manifest.json          # PWA manifest
│
├── middleware.ts              # Next.js middleware (locale routing)
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project overview
```

## 📝 File Organization Rules

### Documentation (`docs/`)
All markdown documentation files except `README.md` are stored here:
- Setup and deployment guides
- Feature implementation summaries
- Quick reference guides
- i18n and PWA documentation

### Library Code (`lib/`)
Reusable code, utilities, and configuration:
- **`lib/config/`** - Application configuration files
  - i18n settings
  - next-intl configuration

### Components (`components/`)
Reusable React components used across the application.

### Messages (`messages/`)
i18n translation JSON files for each supported locale.

## 🔄 Import Path Updates

After reorganization, import paths were updated:

### Before:
```typescript
import { locales } from '@/i18n.config';
import './next-intl.config.ts';
```

### After:
```typescript
import { locales } from '@/lib/config/i18n.config';
import './lib/config/next-intl.config.ts';
```

## 🎯 Benefits

1. **Clear Separation** - Documentation, code, and configuration are clearly separated
2. **Scalability** - Easy to add new utilities, configs, or docs
3. **Maintainability** - Developers can quickly find what they need
4. **Best Practices** - Follows Next.js and React project conventions

## 📌 Notes

- `README.md` stays in the root for GitHub visibility
- Config files like `next.config.ts`, `tsconfig.json` remain in root (Next.js convention)
- The `lib/` folder can be extended with:
  - `lib/utils/` - Utility functions
  - `lib/hooks/` - Custom React hooks
  - `lib/api/` - API client code
  - `lib/types/` - TypeScript type definitions
