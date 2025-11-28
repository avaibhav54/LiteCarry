import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Check against environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === validUsername && password === validPassword) {
      // Create a simple session token (in production, use JWT)
      const sessionToken = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        success: true,
        token: sessionToken,
        message: 'Login successful',
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Admin login error');
    res.status(500).json({ error: 'Login failed' });
  }
});

// Upload image to Supabase Storage
router.post('/upload-image', async (req: Request, res: Response) => {
  try {
    const { file, fileName } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and fileName are required' });
    }

    // Convert base64 to buffer
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique file name
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `products/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error({ error }, 'Failed to upload image to Supabase');
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    res.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    logger.error({ error }, 'Image upload error');
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Create product
router.post('/products', async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      base_price,
      compare_at_price,
      brand,
      sku,
      stock_quantity,
      category_ids,
    } = req.body;

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        base_price,
        compare_at_price,
        brand,
        sku,
        stock_quantity: stock_quantity || 0,
        is_published: true,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Link categories
    if (category_ids && category_ids.length > 0) {
      const categoryLinks = category_ids.map((categoryId: string) => ({
        product_id: product.id,
        category_id: categoryId,
      }));

      const { error: linkError } = await supabase
        .from('product_categories')
        .insert(categoryLinks);

      if (linkError) throw linkError;
    }

    res.json({ success: true, product });
  } catch (error) {
    logger.error({ error }, 'Failed to create product');
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      base_price,
      compare_at_price,
      brand,
      sku,
      stock_quantity,
      is_published,
      category_ids,
    } = req.body;

    // Update product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        name,
        slug,
        description,
        base_price,
        compare_at_price,
        brand,
        sku,
        stock_quantity,
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) throw productError;

    // Update category links if provided
    if (category_ids) {
      // Delete existing links
      await supabase.from('product_categories').delete().eq('product_id', id);

      // Insert new links
      if (category_ids.length > 0) {
        const categoryLinks = category_ids.map((categoryId: string) => ({
          product_id: id,
          category_id: categoryId,
        }));

        await supabase.from('product_categories').insert(categoryLinks);
      }
    }

    res.json({ success: true, product });
  } catch (error) {
    logger.error({ error }, 'Failed to update product');
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete category links first
    await supabase.from('product_categories').delete().eq('product_id', id);

    // Delete product images
    await supabase.from('product_images').delete().eq('product_id', id);

    // Delete product
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error({ error }, 'Failed to delete product');
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Upload product image
router.post('/products/:id/images', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { image_url, is_primary } = req.body;

    // If this is set as primary, unset other primary images
    if (is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
    }

    const { data: image, error } = await supabase
      .from('product_images')
      .insert({
        product_id: id,
        storage_path: image_url,
        is_primary: is_primary || false,
        display_order: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, image });
  } catch (error) {
    logger.error({ error }, 'Failed to upload image');
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get all products (for admin)
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (storage_path, is_primary),
        product_categories (
          categories (id, name, slug)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(products);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch products');
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all orders (for admin)
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        currency,
        shipping_name,
        shipping_email,
        shipping_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        created_at,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(orders);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch orders');
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
