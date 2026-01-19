import React, { useState } from 'react';
import './PaymentModal.css'; // Reusing existing modal styles
import api from '../utils/api';
// import { fincodeKeyValidator } from '../utils/fincodeKeyValidator';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  fincodeOrderId: string;
  refundableAmount: number;
  onSuccess: (refundData: any) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  fincodeOrderId,
  refundableAmount,
  onSuccess,
}) => {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = { reason };
      if (refundType === 'partial') {
        const refundAmount = parseInt(amount, 10);
        if (isNaN(refundAmount) || refundAmount <= 0) {
          setError('Please enter a valid amount');
          setLoading(false);
          return;
        }
        if (refundAmount > refundableAmount) {
          setError(`Amount cannot exceed refundable amount (¥${refundableAmount.toLocaleString()})`);
          setLoading(false);
          return;
        }
        payload.amount = refundAmount;
      }

      // Backend handles the actual refund with Fincode now
      const response = await api.post(`/api/v1/payments/${fincodeOrderId}/refund`, payload);

      if (response.data.success) {
        onSuccess(response.data);
        onClose();
      } else {
        setError(response.data.error || 'Refund failed');
      }
    } catch (err: any) {
      console.error('Refund error:', err);
      setError(err.response?.data?.error || err.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Process Refund</h2>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Order ID:</span>
              <span className="text-sm font-mono text-blue-900">{fincodeOrderId}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-blue-700">Refundable Amount:</span>
              <span className="text-lg font-bold text-blue-900">¥{refundableAmount.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={refundType === 'full'}
                    onChange={() => setRefundType('full')}
                    className="form-radio text-blue-600"
                  />
                  <span className="text-gray-700">Full Refund</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={refundType === 'partial'}
                    onChange={() => setRefundType('partial')}
                    className="form-radio text-blue-600"
                  />
                  <span className="text-gray-700">Partial Refund</span>
                </label>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (¥)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={refundableAmount}
                    min={1}
                    placeholder={`Max: ${refundableAmount}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required={refundType === 'partial'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for refund"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Refund Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
