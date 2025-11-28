import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const Route = createFileRoute('/product/$id')({
  component: ProductDetail,
});

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  stock_quantity: number;
  brand: string | null;
  weight_kg: number | null;
  product_images: Array<{ storage_path: string; is_primary: boolean }>;
}

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/api/v1/products/id/${id}`);
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LiteCarry
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              {product.product_images && product.product_images.length > 0 ? (
                <img
                  src={product.product_images[selectedImage]?.storage_path}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-32 w-32 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  Lightweight
                </span>
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.product_images && product.product_images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.product_images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-blue-600 scale-105'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <img
                      src={image.storage_path}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
                  {product.brand}
                </p>
              )}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-4xl font-bold text-gray-900">
                  ₹{product.base_price.toLocaleString('en-IN')}
                </p>
                {product.stock_quantity > 0 ? (
                  <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                    In Stock
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.weight_kg && (
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Ultra-Lightweight</p>
                    <p className="text-gray-600">Just {product.weight_kg} kg</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setShowOrderForm(true)}
                disabled={product.stock_quantity === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Buy Now'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Free shipping on all orders • 30-day returns
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <OrderForm
          product={product}
          onClose={() => setShowOrderForm(false)}
          onSuccess={() => {
            setShowOrderForm(false);
            // Show success message or redirect
          }}
        />
      )}
    </div>
  );
}

// Order Form Component
function OrderForm({
  product,
  onClose,
  onSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: formData.quantity,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
          shipping_address: {
            line1: formData.address_line1,
            line2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postal_code,
            country: formData.country,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Order placed successfully! Order number: ${result.order_number}`);
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to place order');
      }
    } catch (err) {
      setError('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = product.base_price * formData.quantity;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Complete Your Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {product.product_images[0] && (
                <img
                  src={product.product_images[0].storage_path}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-gray-600">₹{product.base_price.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Qty:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address, P.O. box"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="IN">India</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
