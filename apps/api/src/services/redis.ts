// Redis disabled - using in-memory storage for development
// To re-enable, uncomment the code below and set REDIS_URL in .env

// import Redis from 'ioredis';
// const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// export const redis = new Redis(redisUrl);

// No-op cache functions (Redis disabled)
export const cache = {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  },

  async set(_key: string, _value: unknown, _ttlSeconds?: number): Promise<void> {
    // No-op
  },

  async del(_key: string): Promise<void> {
    // No-op
  },

  async delPattern(_pattern: string): Promise<void> {
    // No-op
  },
};
