import { Gender } from "./client/client";

export interface ClientFilter {
  page: number;
  size: number;

  nome?: string;
  genero?: Gender;
  cpf?: string;
  email?: string;
  telefone?: string;

  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  pais?: string;

  ativo?: boolean;
}
