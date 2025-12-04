export interface Address {
  tipoEndereco: AddressType;
  tipoResidencia: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
  observacoes?: string;
}
export enum AddressType {
  COBRANCA = 'COBRANCA',
  RESIDENCIAL = 'RESIDENCIAL',
  ENTREGA = 'ENTREGA'
}
