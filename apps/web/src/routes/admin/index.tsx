import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  stock_quantity: number;
  is_published: boolean;
  product_images: Array<{ storage_path: string; is_primary: boolean }>;
  product_categories: Array<{ categories: { name: string } }>;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate({ to: '/admin/login' });
    }
  }, [navigate]);

  const { data: products, isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/v1/admin/products');
      return res.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate({ to: '/admin/login' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/v1/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        refetch();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-4">
              <Link
                to="/admin"
                className="text-blue-600 font-semibold hover:underline"
              >
                Products
              </Link>
              <Link to="/admin/orders" className="text-gray-600 hover:text-blue-600 transition-colors">
                Orders
              </Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                View Site
              </Link>
              <button onClick={handleLogout} className="text-red-600 hover:underline">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Products</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingProduct) && (
          <ProductForm
            product={editingProduct}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingProduct(null);
              refetch();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingProduct(null);
            }}
          />
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.product_images[0] && (
                          <img
                            src={product.product_images[0].storage_path}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{product.base_price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No products found. Add your first product!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Product Form Component
function ProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    base_price: product?.base_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    brand: '',
    sku: product?.slug || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    product?.product_images.map((img) => img.storage_path) || []
  );
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Convert file to base64
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;

              const response = await fetch('http://localhost:3001/api/v1/admin/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  file: base64,
                  fileName: file.name,
                }),
              });

              const data = await response.json();
              if (data.success) {
                resolve(data.url);
              } else {
                reject(new Error('Upload failed'));
              }
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);
    } catch (error) {
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product
        ? `http://localhost:3001/api/v1/admin/products/${product.id}`
        : 'http://localhost:3001/api/v1/admin/products';

      const response = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const productId = product?.id || result.product?.id;

        // Upload images if any
        if (uploadedImages.length > 0 && productId) {
          for (let i = 0; i < uploadedImages.length; i++) {
            await fetch(`http://localhost:3001/api/v1/admin/products/${productId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: uploadedImages[i],
                is_primary: i === 0,
              }),
            });
          }
        }

        onSuccess();
      } else {
        alert('Failed to save product');
      }
    } catch (error) {
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{product ? 'Edit Product' : 'Add New Product'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) =>
                setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
          <div className="space-y-4">
            {/* Upload Button */}
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className={`inline-block px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </label>
              <span className="ml-2 text-sm text-gray-500">
                {uploadedImages.length > 0 ? `${uploadedImages.length} image(s) uploaded` : 'No images uploaded'}
              </span>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
