# Currency Management System

## Overview
Supports multi-currency with one default currency.

## Database
Table `currencies`:
- `code`: ISO 4217 (e.g. USD, SAR)
- `exchangeRate`: Relative to base (or default).
- `isDefault`: Only one true.

## Utilities
`lib/currency/index.ts`:
- `formatAmount(amount, currency, locale)`
- `convertAmount(amount, from, to)`
- `getCurrency(code)`
- `getDefaultCurrency()`

## APIs
- `GET /api/public/currencies`: List active currencies.
- `GET /api/public/currencies/default`: Get default.
- `GET /api/admin/currencies`: Manage currencies (RBAC).
