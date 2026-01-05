/* eslint-disable @typescript-eslint/no-explicit-any */
import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';
import { Locale } from '../config/i18n.config';
import { enUS, arSA } from 'date-fns/locale';

const dateLocales: Record<Locale, any> = {
  en: enUS,
  ar: arSA,
};

/**
 * Converts a date to UTC from a specific timezone
 * Use this when receiving input from client (e.g. "2023-10-01 10:00") with a user's timezone
 */
export function toUTC(date: Date | string | number, timeZone: string): Date {
  return fromZonedTime(date, timeZone);
}

/**
 * Converts a UTC date to a specific timezone
 * Use this when displaying dates to the user
 */
export function fromUTC(date: Date | string | number, timeZone: string): Date {
  return toZonedTime(date, timeZone);
}

/**
 * Formats a date for display in a specific timezone and locale
 */
export function format(
  date: Date | string | number, 
  timeZone: string, 
  locale: Locale = 'en',
  formatStr: string = 'PPpp'
): string {
  const zonedDate = toZonedTime(date, timeZone);
  return formatTz(zonedDate, formatStr, {
    timeZone,
    locale: dateLocales[locale],
  });
}

/**
 * Parses a date string from client input into a Date object (UTC)
 * @param input Date string (e.g. "2023-10-25T14:30")
 * @param timeZone User's timezone
 */
export function parseClientDate(input: string, timeZone: string): Date {
  // If input is ISO string with timezone, use it directly?
  // But usually client inputs from datetime-local are just "YYYY-MM-DDTHH:mm" without offset.
  // So we assume the input time IS in the user's timezone.
  
  return fromZonedTime(input, timeZone);
}
