export interface Cd {
  id?: number;
  titulo: string;
  artista: string;
  ano: number;
  categoria: string[];
  gravadora: string;
  edicao: string;
  codigoBarras: string;
  numeroFaixas: number;
  duracao: string;
  sinopse: string;
  dimensoes: {
    altura: number;
    largura: number;
    peso: number;
    profundidade: number;
  };
  grupoPrecificacao: string;
  valorCusto: number;
  valorVenda: number;
  estoque: number;
  ativo: boolean;
}
