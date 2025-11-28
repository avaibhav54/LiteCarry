import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '@/services/supabase.js';
import { logger } from '@/lib/logger.js';
import { validateQuery } from '@/middleware/validate.js';
import { searchLimiter } from '@/middleware/rate-limit.js';

const router = Router();

// Validation schema
const searchQuerySchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/v1/search - Full-text search
router.get('/', searchLimiter, validateQuery(searchQuerySchema), async (req, res) => {
  try {
    const { q, limit } = req.query as unknown as z.infer<typeof searchQuerySchema>;

    // Full-text search with trigram fuzzy matching
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id,
        slug,
        name,
        base_price,
        compare_at_price,
        brand,
        product_images!inner (
          storage_path,
          is_primary
        )
      `
      )
      .eq('is_published', true)
      .eq('product_images.is_primary', true)
      .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
      .limit(limit);

    if (error) {
      logger.error({ error, query: q }, 'Search failed');
      res.status(500).json({ error: 'Search failed' });
      return;
    }

    const result = {
      query: q,
      results: data || [],
      count: data?.length || 0,
    };

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error in search');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/search/autocomplete - Quick autocomplete
router.get('/autocomplete', searchLimiter, validateQuery(searchQuerySchema), async (req, res) => {
  try {
    const { q } = req.query as unknown as z.infer<typeof searchQuerySchema>;

    const { data, error } = await supabase
      .from('products')
      .select('name, brand, slug')
      .eq('is_published', true)
      .ilike('name', `%${q}%`)
      .limit(10);

    if (error) {
      logger.error({ error, query: q }, 'Autocomplete failed');
      res.status(500).json({ error: 'Autocomplete failed' });
      return;
    }

    const result = data || [];

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error in autocomplete');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
