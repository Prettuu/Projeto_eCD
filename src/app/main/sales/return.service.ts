import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Return, CreateReturnRequest, ReturnStatus } from '../../shared/model/sales/return';

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private readonly API_URL = 'http://localhost:3000/api/returns';

  constructor(private http: HttpClient) {}

  getAll(clientId?: number, status?: string): Observable<Return[]> {
    const params: any = {};
    if (clientId) params.clientId = clientId;
    if (status) params.status = status;

    return this.http.get<Return[]>(this.API_URL, { params });
  }

  getById(id: number): Observable<Return> {
    return this.http.get<Return>(`${this.API_URL}/${id}`);
  }

  create(request: CreateReturnRequest): Observable<Return> {
    return this.http.post<Return>(this.API_URL, request);
  }

  updateStatus(id: number, status: ReturnStatus, observacoes?: string): Observable<Return> {
    return this.http.patch<Return>(`${this.API_URL}/${id}/status`, {
      status,
      observacoes
    });
  }

  approve(id: number, observacoes?: string): Observable<Return> {
    return this.updateStatus(id, 'APROVADA', observacoes);
  }

  reject(id: number, observacoes?: string): Observable<Return> {
    return this.updateStatus(id, 'NEGADA', observacoes);
  }

  confirmReceived(id: number): Observable<Return> {
    return this.http.post<Return>(`${this.API_URL}/${id}/received`, {});
  }

  cancel(id: number, observacoes?: string): Observable<Return> {
    return this.updateStatus(id, 'CANCELADA', observacoes);
  }
}

