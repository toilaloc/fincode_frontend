import React, { useState } from 'react';
import type { Payment } from '../types/payment';
import { getStatusColor, canCancelPayment, canRefundPayment } from '../utils/paymentHelpers';

interface PaymentCardProps {
  payment: Payment;
  cancellingPaymentId: number | null;
  onCancelPayment: (orderId: string) => void;
  onOpenRefundModal: (payment: Payment) => void;
  onNavigate: (path: string) => void;
  isDetailView?: boolean;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  cancellingPaymentId,
  onCancelPayment,
  onOpenRefundModal,
  onNavigate,
  isDetailView = false
}) => {
  const [isRefundsExpanded, setIsRefundsExpanded] = useState(false);
  const isInactive = ['refunded', 'cancelled', 'partially_refunded'].includes(payment.status);

  // Combine timeline events
  const timelineEvents = [
    { label: 'Created', date: payment.created_at, color: 'bg-blue-200' },
    payment.authorized_at ? { label: 'Authorized', date: payment.authorized_at, color: 'bg-blue-500' } : null,
    payment.captured_at ? { label: 'Captured', date: payment.captured_at, color: 'bg-green-500' } : null,
    ...(payment.refunds || []).map(r => ({ label: 'Refund Processed', date: r.processed_at, color: 'bg-orange-300' })),
    payment.status === 'refunded' ? { label: 'Refunded', date: payment.updated_at, color: 'bg-purple-500' } : null,
    payment.status === 'partially_refunded' ? { label: 'Partial Refund', date: payment.updated_at, color: 'bg-purple-500' } : null,
    payment.status === 'cancelled' ? { label: 'Cancelled', date: payment.updated_at, color: 'bg-gray-500' } : null,
  ].filter(Boolean).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div
      className={`relative group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl ${isInactive ? 'opacity-75 grayscale' : ''
        }`}
    >
      {/* Disabled Overlay/Watermark */}
      {isInactive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-25 overflow-hidden">
          <span className={`text-4xl md:text-5xl font-black uppercase transform -rotate-12 select-none border-4 px-6 py-2 rounded-xl whitespace-nowrap ${['refunded', 'partially_refunded'].includes(payment.status)
            ? 'text-red-600 border-red-600'
            : 'text-gray-900 border-gray-900'
            }`}>
            {payment.status === 'partially_refunded' ? 'REFUNDED' : payment.status}
          </span>
        </div>
      )}

      {/* Card Header */}
      <div className={`px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${isInactive ? 'bg-gray-50' : 'bg-white'}`}>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500">#{payment.id}</span>
            <h2 className="text-lg font-bold text-gray-900 font-mono tracking-wide">
              {payment.fincode_order_id}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(payment.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(payment.status)} ring-1 ring-inset ring-black/5`}>
            {payment.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Column 1: Product & Order */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order & Product</h3>
            {payment.order ? (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Order No.</span>
                  <span className="text-sm font-medium text-gray-900">#{payment.order.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Product ID</span>
                  <span className="text-sm font-medium text-gray-900">#{payment.order.product.id}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <span className="text-sm font-medium text-gray-900">x{payment.order.quantity}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No associated order details.</div>
            )}
          </div>

          {/* Column 2: Payment Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Payment Timeline</h3>
            <div className="flex flex-col gap-1 text-xs">
              {timelineEvents.map((event: any, idx: number) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ring-1 ring-white flex-shrink-0 ${event.color}`}></div>
                    <div className="flex items-baseline gap-2 min-w-0">
                      <p className="font-medium text-gray-900 text-xs">{event.label}</p>
                      <p className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {/* Vertical Connector Line */}
                  {idx < timelineEvents.length - 1 && (
                    <div className="w-0.5 h-2 bg-gray-200 ml-1 rounded-full"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Column 3: Amount & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Amount</h3>
              <div className="text-3xl font-extrabold text-blue-600">
                ¥{payment.amount.toLocaleString()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-6 justify-end">
              {!isDetailView && (
                <button
                  onClick={() => onNavigate(`/orders/${payment.fincode_order_id}`)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Details
                </button>
              )}

              {canCancelPayment(payment.status) && (
                <button
                  onClick={() => onCancelPayment(payment.fincode_order_id)}
                  disabled={cancellingPaymentId === payment.id}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {cancellingPaymentId === payment.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}

              {canRefundPayment(payment.status) && (
                <button
                  onClick={() => onOpenRefundModal(payment)}
                  className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-medium rounded-lg transition-colors"
                >
                  Refund
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Refund History (Collapsible) */}
        {(payment.refunds?.length ?? 0) > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsRefundsExpanded(!isRefundsExpanded)}
              className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors w-full"
            >
              <span className={`transform transition-transform duration-200 ${isRefundsExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Refund History ({payment.refunds?.length ?? 0})
            </button>

            {isRefundsExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 animate-fadeIn">
                {(payment.refunds || []).map((refund) => (
                  <div key={refund.id} className="bg-orange-50/50 border border-orange-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold text-orange-700">
                        -¥{refund.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">
                        {refund.status}
                      </span>
                    </div>
                    {refund.reason && (
                      <p className="text-xs text-orange-800/80 mb-1">
                        "{refund.reason}"
                      </p>
                    )}
                    <p className="text-[10px] text-orange-400">
                      {new Date(refund.processed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;
