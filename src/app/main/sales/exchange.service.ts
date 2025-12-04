import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exchange, CreateExchangeRequest, ExchangeStatus } from '../../shared/model/sales/exchange';

@Injectable({ providedIn: 'root' })
export class ExchangeService {
  private readonly API_URL = 'http://localhost:3000/api/exchanges';

  constructor(private http: HttpClient) {}

  getAll(clientId?: number, status?: string): Observable<Exchange[]> {
    const params: any = {};
    if (clientId) params.clientId = clientId;
    if (status) params.status = status;

    return this.http.get<Exchange[]>(this.API_URL, { params });
  }

  getById(id: number): Observable<Exchange> {
    return this.http.get<Exchange>(`${this.API_URL}/${id}`);
  }

  create(request: CreateExchangeRequest): Observable<Exchange> {
    return this.http.post<Exchange>(this.API_URL, request);
  }

  updateStatus(id: number, status: ExchangeStatus, observacoes?: string, couponCode?: string): Observable<Exchange> {
    return this.http.patch<Exchange>(`${this.API_URL}/${id}/status`, {
      status,
      observacoes,
      couponCode
    });
  }

  approve(id: number, observacoes?: string): Observable<Exchange> {
    return this.updateStatus(id, 'APROVADA', observacoes);
  }

  reject(id: number, observacoes?: string): Observable<Exchange> {
    return this.updateStatus(id, 'NEGADA', observacoes);
  }

  cancel(id: number, observacoes?: string): Observable<Exchange> {
    return this.updateStatus(id, 'CANCELADA', observacoes);
  }

  confirmReceived(id: number): Observable<Exchange> {
    return this.http.post<Exchange>(`${this.API_URL}/${id}/confirm-received`, {});
  }
}

