import { Address } from "./address";
import { CreditCard } from "./credit-card";
import { Phone } from "./phone";

export interface Client {
  id?: number;
  genero: Gender;
  nome: string;
  dataNascimento: Date;
  cpf: string;
  telefone: Phone;
  email: string;
  senha: string;
  ativo: boolean;
  enderecoResidencial: Address;
  outrosEnderecos?: Address[];
  cartoes?: CreditCard[];
  rankingPoints?: number;
}

export enum Gender {
  HO = 'HO',
  MU = 'MU',
  NB = 'NB',
  OU = 'OU',
}
