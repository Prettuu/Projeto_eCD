export interface ExchangeCoupon {
  id: number;
  code: string;
  exchangeId: number;
  clientId: number;
  value: number;
  used: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

