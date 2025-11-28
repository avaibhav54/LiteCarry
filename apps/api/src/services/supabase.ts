import { createClient } from '@supabase/supabase-js';
import type { Database } from '@luggage/shared-types/database';

// Default to placeholder values for development
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

if (!process.env.SUPABASE_URL) {
  console.warn('⚠️  SUPABASE_URL not set - using placeholder. Set it in .env for full functionality.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
