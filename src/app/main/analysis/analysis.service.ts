import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductSales {
  productId: number;
  titulo: string;
  artista: string;
  categoria: string;
  quantidadeVendida: number;
  valorTotal: number;
  quantidadePedidos: number;
}

export interface CategorySales {
  categoria: string;
  quantidadeVendida: number;
  valorTotal: number;
  quantidadePedidos: number;
  quantidadeProdutos: number;
  produtos: string[];
}

export interface ProductsAnalysisResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  totalProducts: number;
  products: ProductSales[];
}

export interface CategoriesAnalysisResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  totalCategories: number;
  categories: CategorySales[];
}

export interface SalesSummary {
  period: {
    startDate: string;
    endDate: string;
  } | null;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalDiscount: number;
    totalItemsSold: number;
    uniqueProductsSold: number;
    averageOrderValue: number;
  };
}

export interface ProductSalesByDate {
  productId: number;
  titulo: string;
  artista: string;
  categoria: string;
  salesByDate: Array<{
    date: string;
    quantity: number;
  }>;
}

export interface ProductsByDateResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  dates: string[];
  products: ProductSalesByDate[];
}

export interface CategorySalesByDate {
  categoria: string;
  salesByDate: Array<{
    date: string;
    value: number;
  }>;
}

export interface CategoriesByDateResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  dates: string[];
  categories: CategorySalesByDate[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private readonly API_URL = 'http://localhost:3000/api/analysis';

  constructor(private http: HttpClient) {}

  /**
   * Comparar vendas de produtos por intervalo de datas
   */
  compareProductsByDateRange(startDate: string, endDate: string): Observable<ProductsAnalysisResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ProductsAnalysisResponse>(`${this.API_URL}/products`, { params });
  }

  /**
   * Comparar vendas por categoria por intervalo de datas
   */
  compareCategoriesByDateRange(startDate: string, endDate: string): Observable<CategoriesAnalysisResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<CategoriesAnalysisResponse>(`${this.API_URL}/categories`, { params });
  }

  /**
   * Obter resumo geral de vendas
   */
  getSalesSummary(startDate?: string, endDate?: string): Observable<SalesSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<SalesSummary>(`${this.API_URL}/summary`, { params });
  }

  /**
   * Obter vendas de produtos agrupadas por data
   */
  getProductsByDate(startDate: string, endDate: string): Observable<ProductsByDateResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ProductsByDateResponse>(`${this.API_URL}/products-by-date`, { params });
  }

  /**
   * Obter vendas de categorias agrupadas por data
   */
  getCategoriesByDate(startDate: string, endDate: string): Observable<CategoriesByDateResponse> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<CategoriesByDateResponse>(`${this.API_URL}/categories-by-date`, { params });
  }
}

