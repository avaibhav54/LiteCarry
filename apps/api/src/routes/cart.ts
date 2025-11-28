import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '@/services/supabase.js';
import { logger } from '@/lib/logger.js';
import { validateBody } from '@/middleware/validate.js';
import { extractSession } from '@/middleware/auth.js';

const router = Router();

// Use session middleware for all cart routes
router.use(extractSession);

// In-memory cart storage (in production, use Redis or database)
const cartStore = new Map<string, any>();

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

// Helper to get/set cart
function getCart(sessionId: string) {
  return cartStore.get(sessionId) || { items: [], updatedAt: Date.now() };
}

function setCart(sessionId: string, cart: any) {
  cartStore.set(sessionId, cart);
}

function deleteCart(sessionId: string) {
  cartStore.delete(sessionId);
}

// GET /api/v1/cart - Get cart
router.get('/', async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;
    const cart = getCart(sessionId);

    res.json(cart);
  } catch (error) {
    logger.error({ error }, 'Error getting cart');
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// POST /api/v1/cart/items - Add item to cart
router.post('/items', validateBody(addToCartSchema), async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;
    const { productId, variantId, quantity } = req.body;

    // Fetch product details
    const { data: product, error } = (await supabase
      .from('products')
      .select(
        `
        id,
        name,
        base_price,
        stock_quantity,
        product_images!inner (storage_path, is_primary)
      `
      )
      .eq('id', productId)
      .eq('is_published', true)
      .eq('product_images.is_primary', true)
      .single()) as any;

    if (error || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Check stock
    if (product.stock_quantity < quantity) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    // Get current cart
    const cart = getCart(sessionId);

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) =>
        item.productId === productId &&
        (variantId ? item.variantId === variantId : !item.variantId)
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        id: `${productId}-${variantId || 'base'}-${Date.now()}`,
        productId,
        variantId: variantId || null,
        name: product.name,
        price: product.base_price,
        quantity,
        image: product.product_images[0]?.storage_path || null,
      });
    }

    cart.updatedAt = Date.now();

    // Save cart
    setCart(sessionId, cart);

    res.json(cart);
  } catch (error) {
    logger.error({ error }, 'Error adding to cart');
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PATCH /api/v1/cart/items/:itemId - Update cart item quantity
router.patch('/items/:itemId', validateBody(updateCartItemSchema), async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = getCart(sessionId);
    const itemIndex = cart.items.findIndex((item: any) => item.id === itemId);

    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }

    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();

    setCart(sessionId, cart);

    res.json(cart);
  } catch (error) {
    logger.error({ error }, 'Error updating cart item');
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/v1/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;
    const { itemId } = req.params;

    const cart = getCart(sessionId);
    cart.items = cart.items.filter((item: any) => item.id !== itemId);
    cart.updatedAt = Date.now();

    setCart(sessionId, cart);

    res.json(cart);
  } catch (error) {
    logger.error({ error }, 'Error removing cart item');
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// DELETE /api/v1/cart - Clear cart
router.delete('/', async (req, res) => {
  try {
    const sessionId = (req as any).sessionId;

    deleteCart(sessionId);

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    logger.error({ error }, 'Error clearing cart');
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
