import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';

// Import routes
import productsRouter from './routes/products.js';
import searchRouter from './routes/search.js';
import categoriesRouter from './routes/categories.js';
import cartRouter from './routes/cart.js';
import adminRouter from './routes/admin.js';
import ordersRouter from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log what PORT Railway provides
console.log('DEBUG: process.env.PORT=', process.env.PORT);
console.log('DEBUG: Using PORT=', PORT);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(pinoHttp({ logger }));

// Cookie parser (simple implementation)
app.use((req, res, next) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.split('=');
      cookies[name.trim()] = decodeURIComponent(rest.join('='));
    });
  }
  (req as any).cookies = cookies;
  (res as any).cookie = (name: string, value: string, options: any = {}) => {
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    if (options.httpOnly) cookieString += '; HttpOnly';
    if (options.secure) cookieString += '; Secure';
    if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge / 1000}`;
    res.setHeader('Set-Cookie', cookieString);
  };
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/admin', adminRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 API server running on http://0.0.0.0:${PORT}`);
  logger.info(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  logger.info(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
