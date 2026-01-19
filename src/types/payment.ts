export interface Refund {
  id: number;
  amount: number;
  reason: string;
  status: string;
  processed_at: string;
}

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'partially_refunded'
  | 'refunded';

export interface PaymentUser {
  id: number;
  email: string;
  display_name: string;
}

export interface PaymentProduct {
  id: number;
  price: string;
}

export interface PaymentOrder {
  id: number;
  number: string;
  total_amount: number;
  quantity: number;
  product: PaymentProduct;
}

export interface Payment {
  id: number;
  access_id: string;
  public_key: string;
  fincode_order_id: string;
  amount: number;
  status: PaymentStatus;
  refundable_amount?: number;
  authorized_at: string | null;
  captured_at: string | null;
  created_at: string;
  updated_at: string;
  refunds?: Refund[];
  user: PaymentUser;
  order: PaymentOrder | null;
}
