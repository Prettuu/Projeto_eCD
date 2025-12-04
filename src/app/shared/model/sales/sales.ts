
export interface CartItem {
  cdId: number;
  titulo: string;
  valorUnitario: number;
  quantidade: number;
  clientId?: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'EXCHANGE' | 'FINAL_CHECKOUT';
  value: number;
  minValue?: number;
  maxDiscount?: number;
  validUntil?: Date;
  usedCount?: number;
  maxUses?: number;
  isActive: boolean;
  isLocal?: boolean;
}

export interface CreditCard {
  id?: number;
  clientId: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface DeliveryAddress {
  id?: number;
  clientId: number;
  name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'COUPON' | 'COMBINED';
  creditCards?: CreditCard[];
  coupons?: Coupon[];
  totalAmount: number;
}

export interface CartSummary {
  clientId: number | null;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  coupons: Coupon[];
  total: number;
  deliveryAddress?: DeliveryAddress;
  paymentMethods: PaymentMethod[];
}

export interface Order {
  id: number;
  clientId: number;
  clientName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupons: Coupon[];
  paymentMethods: PaymentMethod[];
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt?: Date;
  orderNumber: string;
  trackingCode?: string;
  history?: OrderHistory[];
}

export interface OrderItem {
  cdId: number;
  titulo: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  timestamp: Date;
  userId: string;
  notes?: string;
}

export type OrderStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'PARTIAL_REFUND';

