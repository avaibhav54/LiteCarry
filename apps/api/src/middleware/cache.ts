import type { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  ttl: number; // Time to live in seconds
  public?: boolean; // Whether cache is public or private
}

export function cacheMiddleware(options: CacheOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheControl = options.public ? 'public' : 'private';
    res.set('Cache-Control', `${cacheControl}, max-age=${options.ttl}`);
    next();
  };
}

// Preset cache strategies
export const cacheStrategies = {
  // 5 minutes for product pages
  productPage: cacheMiddleware({ ttl: 300, public: true }),

  // 10 minutes for category pages
  categoryPage: cacheMiddleware({ ttl: 600, public: true }),

  // 1 hour for static lists
  staticList: cacheMiddleware({ ttl: 3600, public: true }),

  // No cache for user-specific data
  noCache: (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
  },
};
