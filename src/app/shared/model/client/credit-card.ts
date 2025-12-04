
export interface CreditCard {
  numero: string;
  nomeImpresso: string;
  bandeira: CardFlag;
  codigoSeguranca: string;
  preferencial: boolean;
}

export enum CardFlag {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  ELO = 'ELO',
  AMEX = 'AMEX'
}
