import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RefundModal from '../components/RefundModal';
import PaymentCard from '../components/PaymentCard';
import { usePayments } from '../hooks/usePayments';
import type { Payment } from '../types/payment';

const OrdersPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use Custom Hook for data fetching and business logic
  const {
    payments,
    loading,
    error,
    cancellingPaymentId,
    handleCancelPayment,
    fetchPayments
  } = usePayments(id);

  // Local UI State for Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<Payment | null>(null);

  const handleOpenRefundModal = (payment: Payment) => {
    setSelectedPaymentForRefund(payment);
    setShowRefundModal(true);
  };

  const handleRefundSuccess = () => {
    fetchPayments();
  };

  const handleCancelWrapper = (fincodeOrderId: string) => {
    handleCancelPayment(fincodeOrderId, () => {
      // If we are on detail page, go back to list on cancel (optional UX choice from previous code)
      if (id) {
        navigate('/orders');
      }
    });
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {id ? 'Payment Details' : 'Payment History'}
            </h1>
            {!id && (
              <p className="mt-2 text-lg text-gray-500">
                Track and manage your recent transactions.
              </p>
            )}
          </div>
          {!id && (
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
            >
              Back to Shop
            </button>
          )}
        </div>

        <div className="space-y-8">
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              cancellingPaymentId={cancellingPaymentId}
              onCancelPayment={handleCancelWrapper}
              onOpenRefundModal={handleOpenRefundModal}
              onNavigate={navigate}
              isDetailView={!!id}
            />
          ))}
        </div>

        {payments.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="text-gray-400 text-xl font-light mb-4">No payments found</div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
      {selectedPaymentForRefund && (
        <RefundModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          fincodeOrderId={selectedPaymentForRefund.fincode_order_id}
          refundableAmount={selectedPaymentForRefund.refundable_amount ?? selectedPaymentForRefund.amount}
          onSuccess={handleRefundSuccess}
        />
      )}
    </div>
  );
};

export default OrdersPage;