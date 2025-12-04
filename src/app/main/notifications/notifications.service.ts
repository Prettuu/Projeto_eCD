import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';

export interface Notification {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: 'INFO' | 'ALERTA' | 'PROMOCAO' | 'SISTEMA';
  clientId?: number | null;
  lida: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private apiUrl = 'http://localhost:3000/api/notifications';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.refresh();
  }

  refresh(): void {
    const clientId = this.auth.getClientId() || this.auth.getUserId();
    const params: any = {};
    if (clientId) {
      params.clientId = clientId;
    }

    this.http.get<Notification[]>(this.apiUrl, { params }).subscribe({
      next: (notifications) => {
        this.notificationsSubject.next(notifications);
      },
      error: (err) => {
        console.error('Erro ao carregar notificações:', err);
        this.notificationsSubject.next([]);
      }
    });
  }

  getAll(): Observable<Notification[]> {
    const clientId = this.auth.getClientId() || this.auth.getUserId();
    const params: any = {};
    if (clientId) {
      params.clientId = clientId;
    }

    return this.http.get<Notification[]>(this.apiUrl, { params }).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }

  getById(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => this.refresh())
    );
  }

  markAllAsRead(): Observable<any> {
    const clientId = this.auth.getClientId() || this.auth.getUserId();
    return this.http.put(`${this.apiUrl}/read-all`, { clientId }).pipe(
      tap(() => this.refresh())
    );
  }

  getUnreadCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.lida).length)
    );
  }

  create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, notification).pipe(
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refresh())
    );
  }
}

