# Luggage Shop - Developer Guide for Claude Code

This guide helps Claude Code understand and work with this premium luggage eCommerce codebase.

## Quick Commands

<bash_commands>
make dev              # Start both frontend (port 3000) and backend (port 3001)
make dev-web          # Start only frontend
make dev-api          # Start only backend
make typecheck        # Type check all packages
make generate-types   # Generate API and database types
make lint             # Lint all code
make format           # Format all code
make db-migrate       # Show database migration instructions
make clean            # Remove all build artifacts
make help             # Show all available commands
</bash_commands>

## Architecture Overview

### Tech Stack
- **Frontend**: TanStack Start (SSR React) + Tailwind + shadcn/ui + Framer Motion
- **Backend**: TypeScript + Express + Bun runtime
- **Database**: Supabase (PostgreSQL with full-text search)
- **Caching**: Redis (Upstash for serverless)
- **Storage**: Supabase Storage (images with CDN)
- **Payments**: Stripe (guest checkout with email)
- **Deployment**: Vercel (frontend) + Railway (backend)
- **Monorepo**: Bun workspaces

### Project Structure
```
luggage-shop/
├── apps/
│   ├── web/         # TanStack Start frontend (port 3000)
│   └── api/         # Express backend (port 3001)
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── scripts/         # Build and development scripts
└── Makefile         # Development commands
```

### Port Configuration
- Frontend: `http://localhost:3000` (TanStack Start)
- Backend API: `http://localhost:3001` (Express)

## Development Workflow

### Initial Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase, Stripe, and Redis credentials
   ```

3. **Run database migrations:**
   - Open Supabase Dashboard: https://supabase.com/dashboard
   - Go to SQL Editor
   - Copy contents of `apps/api/migrations/RUN_THIS_IN_SUPABASE.sql`
   - Paste and run in SQL Editor

4. **Start development servers:**
   ```bash
   make dev
   ```

### Adding a New API Endpoint

1. **Define route in Express:**
   ```typescript
   // apps/api/src/routes/products.ts
   import { Router } from 'express';

   const router = Router();

   router.get('/products', async (req, res) => {
     // Implementation
   });

   export default router;
   ```

2. **Register in server:**
   ```typescript
   // apps/api/src/server.ts
   import productRoutes from './routes/products.js';

   app.use('/api/v1', productRoutes);
   ```

3. **Add type definitions (optional but recommended):**
   Update `packages/shared-types/src/api/index.ts` with request/response types

### Adding a New Database Table

1. **Create migration file:**
   ```bash
   # Create new file: apps/api/migrations/00X_add_table_name.sql
   ```

2. **Write SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS table_name (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     -- columns...
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Add indexes
   CREATE INDEX IF NOT EXISTS idx_table_name_field ON table_name(field);
   ```

3. **Update master migration:**
   Add the new migration to `apps/api/migrations/RUN_THIS_IN_SUPABASE.sql`

4. **Run in Supabase SQL Editor**

5. **Generate types:**
   ```bash
   make generate-types
   ```

### Adding a New Frontend Page

1. **Create route file:**
   ```typescript
   // apps/web/app/routes/new-page.tsx
   import { createFileRoute } from '@tanstack/react-router';

   export const Route = createFileRoute('/new-page')({
     component: NewPage,
   });

   function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. **Add to navigation (if needed):**
   Update `apps/web/app/components/layout/header.tsx`

### Adding a shadcn/ui Component

```bash
cd apps/web
bunx shadcn-ui@latest add button
```

This will add the component to `apps/web/app/components/ui/`

## Code Conventions

### General Rules
- **Runtime**: Use `bun` instead of `node` or `npm`
- **Imports**: Always use absolute paths with `~` (frontend) or `@` (backend) aliases
- **Naming**:
  - Files: kebab-case (`product-card.tsx`)
  - Components: PascalCase (`ProductCard`)
  - Functions: camelCase (`getProducts`)
  - Constants: SCREAMING_SNAKE_CASE (`API_URL`)

### Frontend Conventions
- Use shadcn/ui for all UI components
- Use Zustand for global client state (cart, wishlist)
- Use TanStack Query for server state (products, orders)
- Use Framer Motion for animations
- All styling with Tailwind CSS
- Import shadcn components: `import { Button } from '~/components/ui/button'`
- Import utilities: `import { cn } from '~/lib/utils/cn'`

### Backend Conventions
- Use Supabase client for all database operations
- Use Redis for caching and sessions
- Use Pino for logging (not console.log)
- Use Zod for request validation
- All responses should be JSON
- Use proper HTTP status codes

### Type Safety
- **Frontend**: Import types from `@luggage/shared-types`
- **Backend**: Import types from `@luggage/shared-types`
- Never use `any` - use `unknown` if type is truly unknown
- Generate types after schema changes: `make generate-types`

## Database Operations

### Querying with Supabase

```typescript
import { supabase } from '@/services/supabase.js';

// Select with relations
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    product_images (storage_path, is_primary),
    product_ratings (avg_rating, review_count)
  `)
  .eq('is_published', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Full-Text Search

```typescript
// Search using trigram and full-text search
const { data } = await supabase
  .from('products')
  .select('*')
  .or(`
    search_vector.fts(english).${query},
    name.ilike.%${query}%,
    brand.ilike.%${query}%
  `)
  .eq('is_published', true);
```

### Using Redis Cache

```typescript
import { redis } from '@/services/redis.js';

// Set with TTL
await redis.setex('product:123', 3600, JSON.stringify(product));

// Get
const cached = await redis.get('product:123');
const product = cached ? JSON.parse(cached) : null;

// Delete (invalidate)
await redis.del('product:123');
```

## Common Tasks

### Invalidating Cache

When product data changes:
```typescript
await redis.del(`product:${productId}`);
await redis.del('products:list:*'); // Wildcard delete
```

### Uploading Images to Supabase Storage

```typescript
import { supabase } from '@/services/supabase.js';
import sharp from 'sharp';

// Optimize and upload
const optimized = await sharp(buffer)
  .resize(2000, 2000, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();

const { data } = await supabase.storage
  .from('product-images')
  .upload(`products/${productId}/${fileName}.jpg`, optimized, {
    contentType: 'image/jpeg',
    cacheControl: '31536000'
  });
```

### Creating a Stripe Payment

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: totalInCents,
  currency: 'usd',
  metadata: { orderId },
  automatic_payment_methods: { enabled: true }
});
```

## Testing

### Type Checking
```bash
make typecheck
```

### Linting
```bash
make lint
```

### Manual Testing Checklist
- [ ] Product browsing and search
- [ ] Add to cart
- [ ] Checkout flow
- [ ] Admin product creation
- [ ] Image upload
- [ ] Review submission

## Troubleshooting

### "Module not found" errors
```bash
bun install
make clean
bun install
```

### Type errors after schema changes
```bash
make generate-types
make typecheck
```

### Database connection errors
1. Check `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Run `make db-status` to test connection
3. Verify project is not paused in Supabase Dashboard

### Redis connection errors
1. Check `.env` has correct `REDIS_URL`
2. For Upstash, ensure TLS is enabled in connection string
3. Test connection manually

### Port already in use
```bash
make ports  # See what's running
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
```

## Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set framework preset: "Vite"
3. Set root directory: `apps/web`
4. Set build command: `bun run build`
5. Set environment variables:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
6. Deploy!

### Backend (Railway)

1. Connect GitHub repo to Railway
2. Select `apps/api` as root directory
3. Set environment variables (all from `.env`)
4. Railway will auto-detect Bun and deploy
5. Note the public URL for `API_URL`

### Post-Deployment

1. Update `VITE_API_URL` in Vercel to point to Railway URL
2. Update `FRONTEND_URL` in Railway to point to Vercel URL
3. Set up Stripe webhooks to Railway URL + `/api/v1/webhooks/stripe`
4. Update CORS_ORIGINS in Railway to include Vercel URL

## Performance Tips

1. **Use indexes**: All frequently queried columns should have indexes
2. **Cache aggressively**: Use Redis for products, categories, search results
3. **Optimize images**: Always use Supabase transformations for responsive images
4. **Lazy load**: Use `loading="lazy"` on images
5. **Code split**: Use dynamic imports for heavy components
6. **Prefetch**: Use TanStack Query prefetching on hover

## Security Reminders

1. **Never commit .env**: It's in .gitignore but double-check
2. **Use RLS**: Row Level Security is enabled on sensitive tables
3. **Validate input**: Use Zod schemas for all user input
4. **Rate limit**: All public endpoints have rate limiting
5. **Sanitize**: Never trust user input, especially in search queries

## Getting Help

- Check this file first
- Search codebase: `grep -r "pattern" apps/`
- Check logs: `make tail-log`
- Review plan: `/Users/vaibhavagarwal/.claude/plans/smooth-frolicking-glade.md`

## Important Files Reference

| File | Purpose |
|------|---------|
| `Makefile` | All development commands |
| `.env` | Environment variables (NOT in git) |
| `apps/api/migrations/RUN_THIS_IN_SUPABASE.sql` | Master database schema |
| `apps/web/app/routes/__root.tsx` | Root layout and providers |
| `apps/web/app/lib/config/design-tokens.ts` | Design system config |
| `apps/api/src/server.ts` | Express server entry point |
| `packages/shared-types/src/index.ts` | Shared types |

## Next Steps

After initial setup:
1. Review the implementation plan
2. Start with Phase 1 tasks (Foundation)
3. Follow the 8-phase roadmap in the plan
4. Check off items as you complete them

---

**Remember**: This is a premium eCommerce site. Focus on performance, UX, and code quality over rushing features.
