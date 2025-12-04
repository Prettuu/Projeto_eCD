export interface Exchange {
  id: number;
  orderId: number;
  clientId: number;
  status: ExchangeStatus;
  motivo: string;
  observacoes?: string;
  couponGenerated?: string | null;
  generatedCoupon?: {
    code: string;
    value: number;
    used: boolean;
  };
  items: ExchangeItem[];
  order?: {
    id: number;
    total: number;
    status: string;
    paymentStatus: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ExchangeItem {
  id: number;
  exchangeId: number;
  orderItemId: number;
  productId: number;
  quantidade: number;
  motivo?: string;
  orderItem?: {
    id: number;
    productId: number;
    titulo: string;
    quantidade: number;
    valorUnitario: number;
  };
}

export type ExchangeStatus = 
  | 'PENDENTE'
  | 'APROVADA'
  | 'NEGADA'
  | 'TROCA EM ANDAMENTO'
  | 'PROCESSANDO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface CreateExchangeRequest {
  orderId: number;
  clientId: number;
  motivo: string;
  observacoes?: string;
  items: Array<{
    orderItemId: number;
    productId: number;
    quantidade: number;
    motivo?: string;
  }>;
}

