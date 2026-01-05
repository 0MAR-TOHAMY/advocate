import { db } from '../db';
import { currencies } from '../schema';
import { eq, and } from 'drizzle-orm';
import { Locale } from '../config/i18n.config';

export type Currency = typeof currencies.$inferSelect;

let cachedDefaultCurrency: Currency | null = null;
let cachedCurrencies: Record<string, Currency> = {};

export async function getCurrency(code: string): Promise<Currency | null> {
  if (cachedCurrencies[code]) return cachedCurrencies[code];
  
  const currency = await db.query.currencies.findFirst({
    where: and(eq(currencies.code, code), eq(currencies.isActive, true))
  });
  
  if (currency) {
    cachedCurrencies[code] = currency;
  }
  
  return currency || null;
}

export async function getDefaultCurrency(): Promise<Currency> {
  if (cachedDefaultCurrency) return cachedDefaultCurrency;
  
  const currency = await db.query.currencies.findFirst({
    where: eq(currencies.isDefault, true)
  });
  
  if (!currency) {
    // Fallback if no default set in DB
    return {
      id: 'default',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      symbolPosition: 'before',
      decimalPlaces: 2,
      exchangeRate: '1',
      isActive: true,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  cachedDefaultCurrency = currency;
  return currency;
}

export function formatAmount(amount: number, currency: Currency, locale: Locale = 'en'): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  });
  
  // Custom formatting if needed based on symbolPosition, but Intl is usually best
  return formatter.format(amount);
}

export function convertAmount(amount: number, fromCurrency: Currency, toCurrency: Currency): number {
  if (fromCurrency.code === toCurrency.code) return amount;
  
  // Base currency is usually the one with exchangeRate = 1
  // If both are relative to base:
  // Amount in Base = Amount * FromRate
  // Amount in Target = Amount in Base / ToRate
  // So: Target = Amount * FromRate / ToRate
  
  // CAUTION: Floating point math. For production, use a library like currency.js or decimal.js
  const baseAmount = amount * parseFloat(fromCurrency.exchangeRate);
  const targetAmount = baseAmount / parseFloat(toCurrency.exchangeRate);
  
  return Number(targetAmount.toFixed(toCurrency.decimalPlaces));
}

export async function clearCurrencyCache() {
  cachedDefaultCurrency = null;
  cachedCurrencies = {};
}
