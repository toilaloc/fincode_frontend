export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'authorized': return 'bg-blue-100 text-blue-800';
    case 'captured': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    case 'partially_refunded': return 'bg-orange-100 text-orange-800';
    case 'refunded': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const canCancelPayment = (status: string): boolean => {
  return status === 'authorized';
};

export const canRefundPayment = (status: string): boolean => {
  return status === 'captured' || status === 'partially_refunded';
};
