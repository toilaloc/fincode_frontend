import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import type { Payment } from '../types/payment';

export const usePayments = (id?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingPaymentId, setCancellingPaymentId] = useState<number | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        const response = await api.get(`/api/v1/payments/${id}`);
        setPayments([response.data.payment]);
      } else {
        const response = await api.get('/api/v1/payments');
        setPayments(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleCancelPayment = async (fincodeOrderId: string, onSuccess?: () => void) => {
    if (!confirm('Are you sure you want to cancel this payment?')) return;

    setCancellingPaymentId(payments.find(p => p.fincode_order_id === fincodeOrderId)?.id || null);
    try {
      await api.post(`/api/v1/payments/${fincodeOrderId}/cancel`);
      await fetchPayments(); // Refresh logic
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to cancel payment:', err);
      alert('Failed to cancel payment: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancellingPaymentId(null);
    }
  };

  return {
    payments,
    loading,
    error,
    cancellingPaymentId,
    fetchPayments,
    handleCancelPayment
  };
};
