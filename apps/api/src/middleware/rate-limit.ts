import rateLimit from 'express-rate-limit';

// Public API endpoints (100 requests per 15 minutes)
// Using in-memory store for simplicity (in production, use Redis)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Search endpoints (20 requests per minute)
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many search requests, please slow down' },
});

// Checkout endpoints (10 requests per minute)
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many checkout attempts, please try again later' },
});
