import { randomBytes } from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

const CSRF_EXEMPT_PATHS = [
  '/api/login',
  '/api/register',
  '/api/logout',
  '/api/forgot-password',
  '/api/reset-password',
  '/api/firebase-auth',
];

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();

  const isExempt = CSRF_EXEMPT_PATHS.some(
    (path) => req.path === path || req.path.startsWith(path + '/')
  );

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !isExempt) {
    const sessionToken = req.session?.csrfToken;
    const headerToken = req.headers['x-csrf-token'] as string | undefined;

    if (!sessionToken || sessionToken !== headerToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }

  next();
}
