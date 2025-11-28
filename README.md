# Luggage Shop - Premium eCommerce Platform

A modern, high-performance eCommerce platform for luxury luggage built with TypeScript, TanStack Start, Express, and Supabase.

## Features

- **Premium Shopping Experience**: Smooth animations, responsive design, and intuitive UX
- **Guest Checkout**: Purchase without creating an account (email-only)
- **Advanced Search**: PostgreSQL full-text search with fuzzy matching
- **Product Management**: Full admin dashboard for managing products, orders, and reviews
- **Image Optimization**: Automatic image transformation and CDN delivery via Supabase
- **Reviews & Ratings**: Customer reviews with star ratings and verification
- **Wishlists**: Save products for later
- **Secure Payments**: Stripe integration with webhook support
- **Performance**: Multi-layer caching (Redis + HTTP + client-side)
- **Type Safety**: End-to-end TypeScript with shared types

## Tech Stack

- **Frontend**: TanStack Start (SSR React), Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Express, TypeScript, Bun runtime
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis (Upstash)
- **Storage**: Supabase Storage with CDN
- **Payments**: Stripe
- **Deployment**: Vercel (frontend) + Railway (backend)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Supabase](https://supabase.com/) account
- [Stripe](https://stripe.com/) account
- [Upstash](https://upstash.com/) Redis account (or local Redis)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd luggage-shop
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Run database migrations:**
   - Open your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to SQL Editor
   - Copy the contents of `apps/api/migrations/RUN_THIS_IN_SUPABASE.sql`
   - Paste and run in the SQL Editor

5. **Start development servers:**
   ```bash
   make dev
   ```

6. **Open in browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Development

### Available Commands

```bash
make dev              # Start both frontend and backend
make dev-web          # Start only frontend
make dev-api          # Start only backend
make build            # Build for production
make typecheck        # Type check all packages
make lint             # Lint all code
make format           # Format all code
make clean            # Remove build artifacts
make help             # Show all commands
```

### Project Structure

```
luggage-shop/
├── apps/
│   ├── web/              # TanStack Start frontend
│   │   ├── app/
│   │   │   ├── routes/   # File-based routing
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/              # Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   └── middleware/
│       ├── migrations/   # Database migrations
│       └── package.json
│
├── packages/
│   └── shared-types/     # Shared TypeScript types
│
└── scripts/              # Build and dev scripts
```

### Adding a New Feature

1. Check `CLAUDE.md` for coding conventions
2. Create necessary database migrations
3. Implement backend API endpoints
4. Create frontend components and routes
5. Update shared types
6. Run type checking: `make typecheck`
7. Test locally
8. Commit and deploy

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `REDIS_URL` - Redis connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set root directory to `apps/web`
3. Set build command to `bun run build`
4. Add environment variables (all `VITE_*` vars from `.env`)
5. Deploy

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set root directory to `apps/api`
3. Add all environment variables from `.env`
4. Railway will auto-detect Bun and deploy
5. Configure Stripe webhooks to point to your Railway URL

## Documentation

- **Developer Guide**: See `CLAUDE.md` for detailed development instructions
- **Implementation Plan**: Check `/Users/vaibhavagarwal/.claude/plans/smooth-frolicking-glade.md`
- **API Documentation**: Coming soon
- **Database Schema**: See `apps/api/migrations/RUN_THIS_IN_SUPABASE.sql`

## Performance

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Product list query: < 50ms
- Search query: < 100ms

## Security

- Row Level Security (RLS) enabled on all sensitive tables
- Rate limiting on all public endpoints
- Input validation with Zod
- Secure session management
- CORS protection
- Helmet security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `make typecheck` and `make lint`
5. Commit with descriptive messages
6. Open a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions:
- Check `CLAUDE.md` for development help
- Review implementation plan
- Contact: [your-email@example.com]

---

Built with ❤️ using TypeScript, TanStack Start, Express, and Supabase
# LiteCarry
