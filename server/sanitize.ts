const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_PATTERN = /\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const DANGEROUS_TAG_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|form|link|style|base|meta)\b[^>]*>/gi;
const JAVASCRIPT_URI_PATTERN = /(?:href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;

export function sanitizeText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(SCRIPT_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(DANGEROUS_TAG_PATTERN, '')
    .replace(JAVASCRIPT_URI_PATTERN, '');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T {
  const sanitized = { ...obj };
  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      (sanitized as any)[field] = sanitizeText(sanitized[field] as string);
    }
  }
  return sanitized;
}
