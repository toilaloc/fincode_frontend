import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Payment {
  id: number;
  fincode_order_id: string;
  amount: number;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled';
  authorized_at: string | null;
  captured_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    email: string;
    display_name: string;
  };
  order: {
    id: number;
    number: string;
    total_amount: number;
    quantity: number;
    product: {
      id: number;
      price: string;
    };
  } | null;
}

const OrdersPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingPaymentId, setCancellingPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchPaymentDetail();
    } else {
      fetchPayments();
    }
  }, [id]);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/api/v1/payments');
      setPayments(response.data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetail = async () => {
    try {
      const response = await api.get(`/api/v1/payments/${id}`);
      setPayments([response.data.payment]);
    } catch (err: any) {
      console.error('Failed to load payment:', err);
      setError('Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async (fincodeOrderId: string) => {
    if (!confirm('Are you sure you want to cancel this payment?')) return;

    setCancellingPaymentId(payments.find(p => p.fincode_order_id === fincodeOrderId)?.id || null);
    try {
      await api.post(`/api/v1/payments/${fincodeOrderId}/cancel`);
      // Refresh payments after cancellation
      if (id) {
        navigate('/orders');
      } else {
        fetchPayments();
      }
    } catch (err: any) {
      console.error('Failed to cancel payment:', err);
      alert('Failed to cancel payment: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancellingPaymentId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'authorized': return 'bg-blue-100 text-blue-800';
      case 'captured': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelPayment = (status: string) => {
    return ['pending', 'authorized'].includes(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {id ? 'Payment Details' : 'My Payments'}
          </h1>
          {!id && (
            <p className="text-xl text-gray-600">
              View and manage your payment history
            </p>
          )}
        </div>

        <div className="space-y-6">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Payment #{payment.fincode_order_id}
                    </h2>
                    <p className="text-gray-600">
                      Created: {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Details</h3>
                    {payment.order ? (
                      <div>
                        <p className="text-gray-600">Order #{payment.order.number}</p>
                        <p className="text-gray-600">Product #{payment.order.product.id}</p>
                        <p className="text-gray-600">Quantity: {payment.order.quantity}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600">No order information</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Info</h3>
                    <div>
                      <p className="text-gray-600">Amount: ¥{payment.amount.toLocaleString()}</p>
                      {payment.authorized_at && (
                        <p className="text-gray-600">
                          Authorized: {new Date(payment.authorized_at).toLocaleString()}
                        </p>
                      )}
                      {payment.captured_at && (
                        <p className="text-gray-600">
                          Captured: {new Date(payment.captured_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{payment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date(payment.updated_at).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-3">
                    {!id && (
                      <button
                        onClick={() => navigate(`/orders/${payment.fincode_order_id}`)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        View Details
                      </button>
                    )}

                    {canCancelPayment(payment.status) && (
                      <button
                        onClick={() => handleCancelPayment(payment.fincode_order_id)}
                        disabled={cancellingPaymentId === payment.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingPaymentId === payment.id ? 'Cancelling...' : 'Cancel Payment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No payments found</div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Browse Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;