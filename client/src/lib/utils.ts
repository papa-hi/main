import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

export function getMonthAbbreviation(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    month: 'short',
  }).format(date).slice(0, 3);
}

export function getDay(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
  }).format(date);
}

export function getFormattedDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  }
}
