.PHONY: help dev dev-api dev-web build typecheck generate-types lint format clean install

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "═══════════════════════════════════════════════════"
	@echo "  Luggage Shop - Development Commands"
	@echo "═══════════════════════════════════════════════════"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	@bun install
	@echo "✅ Dependencies installed!"

dev: ## Start both frontend and backend dev servers
	@echo "🚀 Starting development servers..."
	@bun run dev

dev-api: ## Start only the backend API server
	@echo "🔧 Starting API server..."
	@cd apps/api && bun run dev

dev-web: ## Start only the frontend web server
	@echo "🎨 Starting web server..."
	@cd apps/web && bun run dev

build: ## Build both frontend and backend for production
	@echo "🏗️  Building all packages..."
	@bun run build
	@echo "✅ Build completed!"

typecheck: ## Type check all packages
	@echo "🔍 Type checking..."
	@bun run typecheck
	@echo "✅ Type check passed!"

generate-types: ## Generate TypeScript types from API and database
	@echo "⚙️  Generating types..."
	@./scripts/generate-types.sh || echo "Run 'bun install' first if this fails"
	@echo "✅ Types generated!"

lint: ## Lint all packages
	@echo "🧹 Linting code..."
	@bun run lint
	@echo "✅ Linting completed!"

format: ## Format all code with Biome
	@echo "✨ Formatting code..."
	@bun run format
	@echo "✅ Code formatted!"

clean: ## Remove all build artifacts and node_modules
	@echo "🧽 Cleaning build artifacts..."
	@bun run clean
	@echo "✅ Cleaned!"

# Database commands
db-migrate: ## Show instructions for running database migrations
	@echo "📊 Database Migration Instructions:"
	@echo ""
	@echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
	@echo "2. Select your project"
	@echo "3. Go to SQL Editor"
	@echo "4. Open file: apps/api/migrations/RUN_THIS_IN_SUPABASE.sql"
	@echo "5. Copy all contents and paste into SQL Editor"
	@echo "6. Click 'Run'"
	@echo ""
	@echo "The migration file is at: apps/api/migrations/RUN_THIS_IN_SUPABASE.sql"

db-status: ## Check database connection (requires .env)
	@echo "🔍 Checking database connection..."
	@cd apps/api && bun -e "import {createClient} from '@supabase/supabase-js'; const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY); const {error}=await s.from('products').select('count'); if(error) {console.log('❌ Error:',error.message);process.exit(1)} else {console.log('✅ Database connected!')}"

# Docker commands (for future use)
docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	@docker-compose build
	@echo "✅ Docker images built!"

docker-up: ## Start Docker containers
	@echo "🐳 Starting Docker containers..."
	@docker-compose up -d
	@echo "✅ Docker containers started!"

docker-down: ## Stop Docker containers
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down
	@echo "✅ Docker containers stopped!"

# Utility commands
tail-log: ## Show last 100 lines of dev.log (if exists)
	@if [ -f dev.log ]; then tail -100 dev.log | perl -pe 's/\e\[[0-9;]*m(?:\e\[K)?//g'; else echo "No dev.log file found"; fi

ports: ## Show what's running on development ports
	@echo "🔍 Checking ports..."
	@lsof -i :3000 -i :3001 || echo "No processes found on ports 3000-3001"

setup: install ## Initial project setup
	@echo "🎉 Running initial setup..."
	@echo ""
	@echo "Next steps:"
	@echo "1. Copy .env.example to .env and fill in your values"
	@echo "2. Run database migrations (make db-migrate)"
	@echo "3. Start development servers (make dev)"
	@echo ""
	@echo "✅ Setup complete!"
