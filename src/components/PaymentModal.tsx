import React, { useState, useCallback } from 'react';
import './PaymentModal.css';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { fincodeKeyValidator } from '../utils/fincodeKeyValidator';

// Types
type PaymentStep = 'review' | 'payment' | 'processing' | 'confirmed' | 'success';

interface Product {
  id: number;
  user_id: number;
  price: string;
}

interface PaymentModalProps {
  product: Product;
  quantity: number;
  totalAmount: number;
  onClose: () => void;
}

interface PaymentData {
  order_id: string;
  access_id: string;
  amount: number;
  public_key: string;
}

interface CardFormData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  holderName: string;
}

/**
 * Payment Modal Component
 * Handles secure card tokenization and payment processing using FinCode SDK
 *
 * Flow:
 * 1. Register payment (Backend) - Get order_id, access_id, public_key
 * 2. Tokenize card (Frontend) - Convert card details to secure token
 * 3. Execute payment (Frontend) - Authorize payment with token
 * 4. Capture payment (Backend) - Complete the transaction
 */
const PaymentModal: React.FC<PaymentModalProps> = ({
  product,
  quantity,
  totalAmount,
  onClose
}) => {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<PaymentStep>('review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    holderName: '',
  });

  // Utility functions
  const formatCardNumber = useCallback((value: string): string => {
    const digitsOnly = value.replace(/\s/g, '');
    const groups = digitsOnly.match(/.{1,4}/g);
    return groups ? groups.join(' ') : value;
  }, []);

  const formatExpiry = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, '').substring(0, 4);
    if (digits.length <= 2) {
      return digits;
    } else {
      const month = digits.substring(0, 2);
      const year = digits.substring(2, 4);
      return `${month}/${year}`;
    }
  }, []);

  const formatCvv = useCallback((value: string): string => {
    return value.replace(/\D/g, '').substring(0, 4);
  }, []);

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiry':
        formattedValue = formatExpiry(value);
        break;
      case 'cvv':
        formattedValue = formatCvv(value);
        break;
      default:
        break;
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  }, [formatCardNumber, formatExpiry, formatCvv]);

  const initializePayment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/v1/payments/register', {
        amount: totalAmount
      });

      const { order_id, access_id, amount, public_key } = response.data;
      fincodeKeyValidator.validatePublicKey(public_key, 'payment initialization');

      setPaymentData({ order_id, access_id, amount, public_key });
      setStep('payment');
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }, [totalAmount]);

  const handleConfirmOrder = useCallback(() => {
    initializePayment();
  }, [initializePayment]);

  const handlePayment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData) return;

    setLoading(true);
    setStep('processing');
    setError('');

    try {
      fincodeKeyValidator.validatePublicKey(paymentData.public_key, 'payment execution');
      const fincodeInstance = (window as any).Fincode(paymentData.public_key);

      // STEP 1: Tokenize card
      const cardData = {
        card_no: formData.cardNumber.replace(/\s/g, ''),
        expire: formData.expiry.replace('/', '').substr(2, 4) + formData.expiry.replace('/', '').substr(0, 2),
        holder_name: formData.holderName,
        security_code: formData.cvv,
      };

      const token = await new Promise<string>((resolve, reject) => {
        fincodeInstance.tokens(
          cardData,
          function (status: number, response: any) {
            if (status === 200 || status === 201) {
              console.log('Card tokenized:', response);
              resolve(response.id);
            } else {
              const errorMessage = response.errors?.[0]?.message ||
                response.errors?.[0]?.error_message ||
                response.message ||
                'Tokenization failed';
              reject(new Error(errorMessage));
            }
          },
          function () {
            reject(new Error('Communication error'));
          }
        );
      });

      console.log('Token created:', token);

      // STEP 2: Execute payment
      const executeResult = await new Promise((resolve, reject) => {
        fincodeInstance.payments(
          {
            id: paymentData.order_id,
            pay_type: 'Card',
            access_id: paymentData.access_id,
            token: token,
            method: '1',
            // Include card details as required by FinCode
            card_no: formData.cardNumber.replace(/\s/g, ''),
            expire: formData.expiry.replace('/', '').substr(2, 4) + formData.expiry.replace('/', '').substr(0, 2),
            holder_name: formData.holderName,
            security_code: formData.cvv,
          },
          function (status: number, response: any) {
            if (status === 200) {
              console.log('Payment executed:', response);
              resolve(response);
            } else {
              const errorMessage = response.errors?.[0]?.message ||
                response.errors?.[0]?.error_message ||
                response.message ||
                'Execute failed';
              reject(new Error(errorMessage));
            }
          },
          function () {
            reject(new Error('Communication error'));
          }
        );
      });

      console.log('Payment authorized:', executeResult);

      setStep('confirmed');

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || err.message || 'Payment failed');
      setStep('payment');
    } finally {
      setLoading(false);
    }
  }, [paymentData, formData, navigate]);

  const handleCapture = useCallback(async () => {
    if (!paymentData) return;

    setLoading(true);
    setError('');

    try {
      const captureResponse = await api.post(
        `/api/v1/payments/${paymentData.order_id}/capture`,
        {
          transaction_id: paymentData.order_id
        }
      );

      if (!captureResponse.data.success) {
        throw new Error(captureResponse.data.error || 'Capture failed');
      }

      console.log('Payment captured:', captureResponse.data);

      setStep('success');
      navigate(`/success/${paymentData.order_id}`);
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(err.response?.data?.error || err.message || 'Capture failed');
      setStep('confirmed');
    } finally {
      setLoading(false);
    }
  }, [paymentData, navigate]);

  const renderContent = () => {
    switch (step) {
      case 'review':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Review Your Order</h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Image</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Product {product.id}</h3>
                  <p className="text-gray-600">Seller: User {product.user_id}</p>
                  <p className="text-gray-600">Quantity: {quantity}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Proceed to Payment'
                )}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Payment Details</h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Order ID:</span>
                <span className="text-sm font-mono text-blue-900">{paymentData?.order_id}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-blue-700">Total:</span>
                <span className="text-lg font-bold text-blue-900">¥{paymentData?.amount.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  name="holderName"
                  value={formData.holderName}
                  onChange={handleInputChange}
                  placeholder="JOHN DOE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span className="text-lg">Processing Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-lg">Pay with</span>
                    <img
                      src="https://docs.fincode.jp/assets/images/logos/fincode.svg"
                      alt="FinCode"
                      className="h-6 w-auto filter brightness-0 invert"
                    />
                  </div>
                )}
              </button>
            </form>
          </div>
        );

      case 'processing':
        return (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we process your payment.</p>
          </div>
        );

      case 'confirmed':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Confirm Payment</h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Order ID:</span>
                <span className="text-sm font-mono text-blue-900">{paymentData?.order_id}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-blue-700">Total:</span>
                <span className="text-lg font-bold text-blue-900">¥{paymentData?.amount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 text-center">Your payment has been authorized. Click below to complete the transaction.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCapture}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Purchase Order'
                )}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your order has been processed successfully.</p>
            <p className="text-sm text-gray-500">Redirecting to order details...</p>
          </div>
        );
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {step !== 'success' && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentModal;
