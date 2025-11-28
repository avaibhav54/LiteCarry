import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrders,
});

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
  order_items: OrderItem[];
}

function AdminOrders() {
  const navigate = useNavigate();

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate({ to: '/admin/login' });
    }
  }, [navigate]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/v1/admin/orders');
      return res.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate({ to: '/admin/login' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
                Products
              </Link>
              <Link
                to="/admin/orders"
                className="text-blue-600 font-semibold hover:underline"
              >
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
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="text-gray-600 text-sm">
            Total: {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 pb-4 border-b border-gray-200">
                    {/* Customer Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer</h4>
                      <p className="text-sm text-gray-900">{order.shipping_name}</p>
                      <p className="text-sm text-gray-600">{order.shipping_email}</p>
                      <p className="text-sm text-gray-600">{order.shipping_phone}</p>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Shipping Address
                      </h4>
                      <p className="text-sm text-gray-600">{order.shipping_address_line1}</p>
                      {order.shipping_address_line2 && (
                        <p className="text-sm text-gray-600">{order.shipping_address_line2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {order.shipping_city}, {order.shipping_state}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shipping_postal_code}, {order.shipping_country}
                      </p>
                    </div>

                    {/* Order Total */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Total Amount</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{item.total_price.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No Orders Yet</h3>
            <p className="text-gray-600">Orders will appear here once customers make purchases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
