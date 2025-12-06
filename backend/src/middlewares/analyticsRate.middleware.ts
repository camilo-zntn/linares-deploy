import { Request, Response, NextFunction } from 'express';

type Entry = { last: number; tokens: number };
const bucket: Map<string, Entry> = new Map();

export function analyticsRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId || 'anon';
  const now = Date.now();
  const windowMs = 1000;
  const maxPerWindow = 3; // permitir hasta 3 eventos por segundo por usuario

  const e = bucket.get(userId) || { last: now, tokens: maxPerWindow };
  const elapsed = now - e.last;
  if (elapsed > windowMs) {
    e.tokens = maxPerWindow;
    e.last = now;
  }

  if (e.tokens <= 0) {
    res.status(204).end();
    return;
  }

  e.tokens -= 1;
  bucket.set(userId, e);
  next();
}