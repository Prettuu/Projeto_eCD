export interface Return {
  id: number;
  orderId: number;
  clientId: number;
  status: ReturnStatus;
  motivo: string;
  observacoes?: string;
  receivedAt?: Date | string | null;
  items: ReturnItem[];
  order?: {
    id: number;
    total: number;
    status: string;
    paymentStatus: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ReturnItem {
  id: number;
  returnId: number;
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

export type ReturnStatus = 
  | 'PENDENTE'
  | 'APROVADA'
  | 'NEGADA'
  | 'RECEBIDA'
  | 'PROCESSANDO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface CreateReturnRequest {
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

