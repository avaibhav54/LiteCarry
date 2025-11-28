import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '@/services/supabase.js';
import { logger } from '@/lib/logger.js';
import { validateQuery } from '@/middleware/validate.js';
import { publicLimiter } from '@/middleware/rate-limit.js';

const router = Router();

// Validation schemas
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).default('newest'),
});

// GET /api/v1/products - List products with filters
router.get('/', publicLimiter, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, category, minPrice, maxPrice, sort } = req.query as unknown as z.infer<
      typeof listQuerySchema
    >;

    // Build query
    let query = supabase
      .from('products')
      .select(
        `
        id,
        slug,
        name,
        base_price,
        compare_at_price,
        brand,
        stock_quantity,
        product_images!inner (
          storage_path,
          is_primary
        )
      `,
        { count: 'exact' }
      )
      .eq('is_published', true)
      .eq('product_images.is_primary', true);

    // Filters
    if (category) {
      const { data: categoryData } = (await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()) as any;

      if (categoryData) {
        const { data: productIds } = (await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', categoryData.id)) as any;

        if (productIds && productIds.length > 0) {
          query = query.in(
            'id',
            productIds.map((p: any) => p.product_id)
          );
        }
      }
    }

    if (minPrice !== undefined) {
      query = query.gte('base_price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('base_price', maxPrice);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('base_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('base_price', { ascending: false });
        break;
      case 'popular':
        // For now, same as newest (can add view count later)
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({ error }, 'Failed to fetch products');
      res.status(500).json({ error: 'Failed to fetch products' });
      return;
    }

    const result = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Error in products list');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/products/id/:id - Get single product by ID
router.get('/id/:id', publicLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (
          id,
          storage_path,
          alt_text,
          display_order,
          is_primary
        ),
        product_categories (
          category:categories (
            id,
            slug,
            name
          )
        ),
        product_variants (
          id,
          sku,
          name,
          price_adjustment,
          stock_quantity,
          attributes
        )
      `
      )
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      logger.warn({ id, error }, 'Product not found');
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Error fetching product');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/products/:slug - Get single product by slug
router.get('/:slug', publicLimiter, async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (
          id,
          storage_path,
          alt_text,
          display_order,
          is_primary
        ),
        product_categories (
          category:categories (
            id,
            slug,
            name
          )
        ),
        product_variants (
          id,
          sku,
          name,
          price_adjustment,
          stock_quantity,
          attributes
        )
      `
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      logger.warn({ slug, error }, 'Product not found');
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    logger.error({ error, slug: req.params.slug }, 'Error fetching product');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
