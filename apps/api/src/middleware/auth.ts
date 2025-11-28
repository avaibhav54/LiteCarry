import type { Request, Response, NextFunction } from 'express';

// Simple admin auth middleware (can be enhanced with JWT later)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

// Optional: Extract session ID from cookies or headers
export function extractSession(req: Request, res: Response, next: NextFunction) {
  // Get session ID from cookie or create new one
  const sessionId =
    req.cookies?.sessionId || req.headers['x-session-id'] || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Attach to request
  (req as any).sessionId = sessionId;

  // Set cookie if not exists
  if (!req.cookies?.sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  next();
}
