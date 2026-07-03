'use client';

import { useState, useEffect } from 'react';

interface Order {
  id: number;
  date: string;
  restaurantName: string;
  itemName: string;
  price: number;
  calories?: number;
  protein?: number;
  score?: number;
  status: string;
  createdAt: string;
}

interface OrderHistoryProps {
  apiBase: string;
}

export function OrderHistory({ apiBase }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch(`${apiBase}/api/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    submitted: 'bg-green-100 text-green-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-500">No orders yet. Your order history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Order History
      </h3>

      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
          >
            <div>
              <div className="flex items-center gap-3">
                <h4 className="font-medium text-gray-900">{order.itemName}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    statusColors[order.status] || statusColors.pending
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{order.restaurantName}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(order.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {order.calories && order.protein && (
                  <span className="ml-2">
                    · {order.calories} cal · {order.protein}g protein
                  </span>
                )}
              </p>
            </div>

            <div className="text-right">
              <span className="font-semibold text-gray-900">
                ${order.price.toFixed(2)}
              </span>
              {order.score && (
                <p className="text-xs text-gray-500">Score: {order.score}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
