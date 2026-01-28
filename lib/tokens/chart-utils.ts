/**
 * Chart utility functions for the admin dashboard
 */

export interface TimeSeriesPoint {
  date: string;
  [key: string]: string | number;
}

/**
 * Fill missing dates in a time series with default values
 * Useful for ensuring charts have data points for every day
 */
export function fillMissingDates<T extends TimeSeriesPoint>(
  data: T[],
  days: number,
  defaultValues: Omit<T, 'date'>
): T[] {
  const result: T[] = [];
  const dataMap = new Map(data.map(d => [d.date, d]));

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existingData = dataMap.get(dateStr);
    if (existingData) {
      result.push(existingData);
    } else {
      result.push({ date: dateStr, ...defaultValues } as T);
    }
  }

  return result;
}

/**
 * Format a date string for display in chart tooltips
 */
export function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date string to show only month/day
 */
export function formatShortDate(dateStr: string): string {
  return dateStr.slice(5); // Returns "MM-DD" from "YYYY-MM-DD"
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Day of week names for activity charts
 */
export const dayOfWeekNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Get short day name
 */
export function getShortDayName(dayIndex: number): string {
  return dayOfWeekNames[dayIndex]?.slice(0, 3) ?? '';
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
