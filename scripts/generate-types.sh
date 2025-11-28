#!/bin/bash

echo "🔧 Generating TypeScript types..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Install with:"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "Skipping Supabase type generation..."
else
    echo "📊 Generating Supabase database types..."

    # Generate types for frontend
    supabase gen types typescript --project-id ${SUPABASE_PROJECT_ID:-your-project-id} > packages/shared-types/src/database/supabase.ts 2>/dev/null || \
    echo "⚠️  Could not generate Supabase types. Make sure SUPABASE_PROJECT_ID is set or run migrations first."
fi

echo "✅ Type generation complete!"
echo ""
echo "Note: API types (from OpenAPI) will be generated when you create apps/api/src/lib/openapi.ts"
