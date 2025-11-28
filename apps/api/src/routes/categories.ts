import { Router } from 'express';
import { supabase } from '@/services/supabase.js';
import { cache } from '@/services/redis.js';
import { logger } from '@/lib/logger.js';
import { publicLimiter } from '@/middleware/rate-limit.js';
import { cacheStrategies } from '@/middleware/cache.js';

const router = Router();

// GET /api/v1/categories - Get all active categories
router.get('/', publicLimiter, cacheStrategies.staticList, async (req, res) => {
  try {
    // Check cache
    const cacheKey = 'categories:all';
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.info('Categories cache hit');
      res.json(cached);
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error({ error }, 'Failed to fetch categories');
      res.status(500).json({ error: 'Failed to fetch categories' });
      return;
    }

    // Cache for 24 hours
    await cache.set(cacheKey, data, 86400);

    res.json(data);
  } catch (error) {
    logger.error({ error }, 'Error in categories list');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/categories/:slug - Get category by slug
router.get('/:slug', publicLimiter, cacheStrategies.categoryPage, async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error({ error }, 'Error fetching category');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
