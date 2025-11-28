import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { logger } from '../lib/logger.js';

const router = Router();

// POST /api/v1/orders - Create a new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      product_id,
      quantity,
      customer,
      shipping_address,
    } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !customer || !shipping_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, sku, base_price, stock_quantity')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check stock
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Calculate amounts
    const subtotal = product.base_price * quantity;
    const tax_amount = 0; // Can add tax calculation later
    const shipping_amount = 0; // Free shipping
    const total_amount = subtotal + tax_amount + shipping_amount;

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    const order_number = orderNumberData || `LUG-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number,
        guest_email: customer.email,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount: 0,
        total_amount,
        currency: 'INR',
        shipping_name: customer.name,
        shipping_email: customer.email,
        shipping_phone: customer.phone,
        shipping_address_line1: shipping_address.line1,
        shipping_address_line2: shipping_address.line2 || null,
        shipping_city: shipping_address.city,
        shipping_state: shipping_address.state,
        shipping_postal_code: shipping_address.postal_code,
        shipping_country: shipping_address.country,
        billing_same_as_shipping: true,
      })
      .select()
      .single();

    if (orderError) {
      logger.error({ error: orderError }, 'Failed to create order');
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create order item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity,
        unit_price: product.base_price,
        total_price: subtotal,
      });

    if (itemError) {
      logger.error({ error: itemError }, 'Failed to create order item');
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Decrement stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: product.stock_quantity - quantity })
      .eq('id', product.id);

    if (stockError) {
      logger.error({ error: stockError }, 'Failed to update stock');
    }

    res.json({
      success: true,
      order_number: order.order_number,
      order_id: order.id,
      total_amount: order.total_amount,
      message: 'Order placed successfully',
    });
  } catch (error) {
    logger.error({ error }, 'Order creation error');
    res.status(500).json({ error: 'Failed to place order' });
  }
});

export default router;
