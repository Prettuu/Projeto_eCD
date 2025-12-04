import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface Cd {
  id: number;
  titulo: string;
  artista: string;
  ano: number;
  categoria: string;
  estoque: number;
  valorCusto: number;
  valorVenda: number;
  ativo: boolean;
  genero?: string;
  gravadora?: string;
  edicao?: string;
  codigoBarras?: string;
  numeroFaixas?: number;
  duracao?: string;
  sinopse?: string;
  dimensoes?: any;
  grupoPrecificacao?: string;
}

@Injectable({ providedIn: 'root' })
export class StockService {
  private apiUrl = 'http://localhost:3000/api/products';
  private cdsCache: Cd[] = [];

  constructor(private http: HttpClient) {
    this.loadFromAPI();
  }

  private loadFromAPI(): void {
    this.getAll().subscribe();
  }

  getAll(): Observable<Cd[]> {
    return this.http.get<Cd[]>(this.apiUrl).pipe(
      map(products => products.map(p => ({
        id: p.id,
        titulo: p.titulo,
        artista: p.artista,
        ano: p.ano,
        categoria: p.categoria,
        estoque: p.estoque,
        valorCusto: p.valorCusto,
        valorVenda: p.valorVenda,
        ativo: p.ativo
      }))),
      tap(products => {
        this.cdsCache = products;
      }),
      catchError(err => {
        console.error('Erro ao buscar produtos da API:', err);

        return of(this.cdsCache);
      })
    );
  }

  getAllAdmin(): Observable<Cd[]> {
    return this.http.get<Cd[]>(`${this.apiUrl}/admin`).pipe(
      map(products => products.map(p => ({
        id: p.id,
        titulo: p.titulo,
        artista: p.artista,
        ano: p.ano,
        categoria: p.categoria,
        estoque: p.estoque,
        valorCusto: p.valorCusto,
        valorVenda: p.valorVenda,
        ativo: p.ativo
      }))),
      tap(products => {
        this.cdsCache = products;
      }),
      catchError(err => {
        console.error('Erro ao buscar produtos da API:', err);
        return of(this.cdsCache);
      })
    );
  }

  getById(id: number): Observable<Cd | undefined> {
    return this.http.get<Cd>(`${this.apiUrl}/${id}`).pipe(
      map(product => ({
        id: product.id,
        titulo: product.titulo,
        artista: product.artista,
        ano: product.ano,
        categoria: product.categoria,
        estoque: product.estoque,
        valorCusto: product.valorCusto,
        valorVenda: product.valorVenda,
        ativo: product.ativo
      })),
      catchError(() => {

        return of(this.cdsCache.find(c => c.id === id));
      })
    );
  }

  getByIdSync(id: number): Cd | undefined {
    return this.cdsCache.find(c => c.id === id);
  }

  getAllSync(): Cd[] {
    return [...this.cdsCache];
  }

  create(input: Omit<Cd, 'id'>): Observable<Cd> {
    return this.http.post<Cd>(this.apiUrl, input).pipe(
      tap(() => this.loadFromAPI())
    );
  }

  update(id: number, input: Omit<Cd, 'id'>): Observable<Cd> {
    return this.http.put<Cd>(`${this.apiUrl}/${id}`, input).pipe(
      tap(() => this.loadFromAPI())
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadFromAPI())
    );
  }

  decrease(items: Array<{ cdId: number; quantidade: number }>): Observable<any> {
    const requests = items.map(it => 
      this.http.patch(`${this.apiUrl}/${it.cdId}/stock`, {
        quantidade: it.quantidade,
        operation: 'decrease'
      })
    );

    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(() => {
          this.loadFromAPI();
          observer.next({});
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }

  increase(items: Array<{ cdId: number; quantidade: number }>): Observable<any> {
    const requests = items.map(it => 
      this.http.patch(`${this.apiUrl}/${it.cdId}/stock`, {
        quantidade: it.quantidade,
        operation: 'increase'
      })
    );
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(() => {
          this.loadFromAPI();
          observer.next({});
          observer.complete();
        })
        .catch(err => observer.error(err));
    });
  }
}
