import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { StockService } from '../stock/stock.service';
import { AuthService } from '../../core/auth.service';

export type PaymentStatus = 'PENDENTE' | 'APROVADO' | 'REPROVADO' | 'ESTORNADO';

export type OrderStatus =
  | 'RASCUNHO'
  | 'EM ABERTO'
  | 'EM PROCESSAMENTO'
  | 'PROCESSANDO'
  | 'APROVADA'
  | 'REPROVADA'
  | 'EM TRANSPORTE'
  | 'TRANSPORTE'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'DEVOLVIDO';

export interface OrderItem {
  id?: number;
  cdId?: number;
  productId?: number;
  titulo: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Order {
  id: number;
  clientId: number;
  clientName?: string;
  items: OrderItem[];
  total: number;
  desconto?: number;
  cupom?: string | null;
  cardId?: number | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
  history?: Array<{
    at: Date;
    from: OrderStatus;
    to: OrderStatus;
    by: string;
    reason?: string;
  }>;
}

interface BackendOrder {
  id: number;
  clientId: number;
  total: number;
  desconto?: number;
  cupom?: string | null;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt?: string;
  items?: Array<{
    id: number;
    productId: number;
    titulo: string;
    quantidade: number;
    valorUnitario: number;
    subtotal: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API_URL = 'http://localhost:3000/api/orders';
  private readonly LS_KEY = 'orders_v1';
  private ordersCache: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  private allowed: Record<OrderStatus, OrderStatus[]> = {
    RASCUNHO: ['PROCESSANDO', 'CANCELADO'],
    'EM ABERTO': ['APROVADA', 'REPROVADA', 'PROCESSANDO', 'CANCELADO'],
    'EM PROCESSAMENTO': ['EM TRANSPORTE', 'CANCELADO'],
    PROCESSANDO: ['APROVADA', 'REPROVADA', 'CANCELADO'],
    APROVADA: ['EM TRANSPORTE', 'TRANSPORTE', 'CANCELADO'],
    REPROVADA: ['CANCELADO'],
    'EM TRANSPORTE': ['ENTREGUE', 'CANCELADO'],
    TRANSPORTE: ['ENTREGUE', 'CANCELADO'],
    ENTREGUE: [],
    CANCELADO: [],
    DEVOLVIDO: [],
  };

  constructor(
    private http: HttpClient,
    private stockService: StockService,
    private auth: AuthService
  ) {
    this.loadFromAPI();
  }

  private loadFromAPI(): void {
    this.getAll().subscribe({
      next: (orders) => {
        console.log('Pedidos carregados da API:', orders.length);
      },
      error: (err) => {
        console.error('Erro ao carregar pedidos:', err);
      }
    });
  }

  private mapBackendToOrder(backend: BackendOrder): Order {
    console.log('mapBackendToOrder - backend:', backend);
    console.log('mapBackendToOrder - backend.items:', backend.items);
    
    const mappedItems = (backend.items || []).map(item => {
      console.log('mapBackendToOrder - mapping item:', item);
      console.log('mapBackendToOrder - item.productId:', item.productId);
      console.log('mapBackendToOrder - item.titulo:', item.titulo);
      console.log('mapBackendToOrder - item.quantidade:', item.quantidade);
      console.log('mapBackendToOrder - item.valorUnitario:', item.valorUnitario);
      console.log('mapBackendToOrder - item.subtotal:', item.subtotal);
      
      const valorUnitario = typeof item.valorUnitario === 'string' 
        ? parseFloat(item.valorUnitario) 
        : Number(item.valorUnitario) || 0;
      const subtotal = typeof item.subtotal === 'string' 
        ? parseFloat(item.subtotal) 
        : Number(item.subtotal) || 0;
      const quantidade = Number(item.quantidade) || 0;
      
      return {
        id: item.id,
        cdId: item.productId,
        productId: item.productId,
        titulo: item.titulo || '',
        quantidade: quantidade,
        valorUnitario: valorUnitario,
        subtotal: subtotal,
      };
    });
    
    console.log('mapBackendToOrder - mappedItems:', mappedItems);
    
    return {
      id: backend.id,
      clientId: backend.clientId,
      clientName: undefined,
      items: mappedItems,
      total: Number(backend.total),
      desconto: Number(backend.desconto || 0),
      cupom: backend.cupom,
      status: this.normalizeStatus(backend.status, this.auth.getRole() === 'CLIENT'),
      paymentStatus: this.normalizePayment(backend.paymentStatus, this.normalizeStatus(backend.status, this.auth.getRole() === 'CLIENT')),
      createdAt: backend.createdAt,
      updatedAt: backend.updatedAt,
      history: [],
    };
  }


  getAll(): Observable<Order[]> {
    const clientId = this.auth.getClientId();
    const params: any = {};
    if (clientId && this.auth.getRole() === 'CLIENT') {
      params.clientId = clientId;
    }

    return this.http.get<BackendOrder[]>(this.API_URL, { params }).pipe(
      map(orders => orders.map(o => this.mapBackendToOrder(o))),
      tap(orders => {
        this.ordersCache = orders;
        this.ordersSubject.next(orders);
      }),
      catchError(err => {
        console.error('Erro ao buscar pedidos:', err);
        return of([]);
      })
    );
  }

  getById(id: number): Observable<Order | undefined> {
    return this.http.get<BackendOrder>(`${this.API_URL}/${id}`).pipe(
      map(backendOrder => {
        console.log('OrderService.getById - backendOrder:', backendOrder);
        const order = this.mapBackendToOrder(backendOrder);
        console.log('OrderService.getById - mapped order:', order);
        return order;
      }),
      catchError(err => {
        console.error('Erro ao buscar pedido:', err);
        return of(undefined);
      })
    );
  }

  create(order: Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'> & { payment?: any }): Observable<Order> {

    const items = order.items.map(item => ({
      productId: item.productId || item.cdId!,
      titulo: item.titulo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      subtotal: item.subtotal || item.valorUnitario * item.quantidade,
    }));

    const payload: any = {
      clientId: order.clientId,
      items,
      total: order.total,
      desconto: order.desconto || 0,
      cupom: order.cupom || null,
      paymentStatus: 'PENDENTE',
    };

    if ((order as any).payment) {
      payload.payment = (order as any).payment;
    }

    return this.http.post<BackendOrder>(this.API_URL, payload).pipe(
      map(backendOrder => {
        const newOrder = this.mapBackendToOrder(backendOrder);
        this.ordersCache.push(newOrder);
        this.ordersSubject.next([...this.ordersCache]);
        return newOrder;
      }),
      catchError(err => {
        console.error('Erro ao criar pedido:', err);
        throw err;
      })
    );
  }

  updateStatus(id: number, status: OrderStatus, paymentStatus?: PaymentStatus): Observable<Order> {
    const payload: any = { status };
    if (paymentStatus) {
      payload.paymentStatus = paymentStatus;
    }

    return this.http.patch<BackendOrder>(`${this.API_URL}/${id}/status`, payload).pipe(
      map(backendOrder => {
        const updatedOrder = this.mapBackendToOrder(backendOrder);
        const index = this.ordersCache.findIndex(o => o.id === id);
        if (index !== -1) {
          this.ordersCache[index] = updatedOrder;
          this.ordersSubject.next([...this.ordersCache]);
        }
        return updatedOrder;
      }),
      catchError(err => {
        console.error('Erro ao atualizar status do pedido:', err);
        throw err;
      })
    );
  }


  getAllSync(): Order[] {
    return [...this.ordersCache];
  }

  getByIdSync(id: number): Order | undefined {
    return this.ordersCache.find(o => o.id === id);
  }

  update(order: Order): void {
    const idx = this.ordersCache.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      this.ordersCache[idx] = this.ensureDefaults({
        ...this.ordersCache[idx],
        ...order,
        updatedAt: new Date(),
      });
      this.ordersSubject.next([...this.ordersCache]);
    }
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`).pipe(
      map(() => {
        this.ordersCache = this.ordersCache.filter((o) => o.id !== id);
        this.ordersSubject.next([...this.ordersCache]);
        return true;
      }),
      catchError((err) => {
        console.error('Erro ao excluir pedido:', err);
        return of(false);
      })
    );
  }

  transition(id: number, to: OrderStatus, by: string = 'system', reason?: string): Observable<boolean> {
    const order = this.getByIdSync(id);
    if (!order) {
      return of(false);
    }

    const can = this.allowed[order.status]?.includes(to);
    if (!can) {
      return of(false);
    }

    let paymentStatus: PaymentStatus | undefined;
    if (to === 'APROVADA') paymentStatus = 'APROVADO';
    if (to === 'REPROVADA') paymentStatus = 'REPROVADO';
    if (to === 'CANCELADO' && order.paymentStatus === 'APROVADO') {
      paymentStatus = 'ESTORNADO';
    }

    return this.updateStatus(id, to, paymentStatus).pipe(
      map(updatedOrder => {

        if (to === 'APROVADA') {
          this.stockService.decrease(
            updatedOrder.items.map((it) => ({
              cdId: it.cdId || it.productId!,
              quantidade: it.quantidade,
            }))
          ).subscribe();
        }

        if (to === 'CANCELADO' || to === 'REPROVADA') {
          if (
            order.status === 'PROCESSANDO' ||
            order.status === 'APROVADA' ||
            order.status === 'EM ABERTO'
          ) {
            this.stockService.increase(
              updatedOrder.items.map((it) => ({
                cdId: it.cdId || it.productId!,
                quantidade: it.quantidade,
              }))
            ).subscribe();
          }
        }

        return true;
      }),
      catchError(err => {
        console.error('Erro ao fazer transição de status:', err);
        return of(false);
      })
    );
  }

  transitionSync(id: number, to: OrderStatus, by: string = 'system', reason?: string): boolean {
    let result = false;
    this.transition(id, to, by, reason).subscribe({
      next: (success) => result = success,
      error: () => result = false
    });
    return result;
  }

  updateStatusLegacy(id: number, legacy: string): void {
    const map = (s: string): OrderStatus | undefined => {
      const x = s.toUpperCase();
      if (x === 'PAGO') return 'APROVADA';
      if (x === 'CANCELADO') return 'CANCELADO';
      if (x === 'ABERTO' || x === 'PROCESSANDO') return 'PROCESSANDO';
      if (x === 'REPROVADO' || x === 'REPROVADA') return 'REPROVADA';
      if (x === 'ENTREGUE') return 'ENTREGUE';
      if (x === 'TRANSPORTE' || x === 'EM TRANSPORTE' || x === 'EM TRÂNSITO') return 'TRANSPORTE';
      return undefined;
    };
    const to = map(legacy);
    if (to) {
      this.transition(id, to, 'compat').subscribe();
    }
  }

  private ensureDefaults(o: any): Order {
    const status = this.normalizeStatus(o.status, this.auth.getRole() === 'CLIENT');
    const paymentStatus = this.normalizePayment(o.paymentStatus, status);
    return {
      id: o.id,
      clientId: o.clientId,
      clientName: o.clientName,
      items: (o.items ?? []).map((item: any) => ({
        ...item,
        id: item.id,
        cdId: item.cdId || item.productId,
        productId: item.productId || item.cdId,
      })),
      total: Number(o.total ?? 0),
      desconto: Number(o.desconto ?? 0),
      cupom: o.cupom ?? null,
      createdAt: o.createdAt ? (typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString()) : new Date().toISOString(),
      updatedAt: o.updatedAt ? (typeof o.updatedAt === 'string' ? o.updatedAt : new Date(o.updatedAt).toISOString()) : undefined,
      history: o.history ?? [],
      status,
      paymentStatus,
    };
  }

  normalizeStatus(s: any, isClient: boolean = false): OrderStatus {
    if (!s) return 'EM PROCESSAMENTO';
    const x = String(s).toUpperCase();
    if (x === 'EM ABERTO' || x === 'ABERTO') return 'EM ABERTO';
    if (x === 'EM PROCESSAMENTO' || x === 'PROCESSAMENTO') return 'EM PROCESSAMENTO';
    if (x === 'PROCESSANDO') return 'PROCESSANDO';
    if (x === 'PAGO' || x === 'APROVADA') return 'APROVADA';
    if (x === 'REPROVADO' || x === 'REPROVADA') return 'REPROVADA';
    if (x === 'EM TRANSPORTE' || x === 'EM TRÂNSITO') return 'EM TRANSPORTE';
    if (x === 'TRANSPORTE') return 'TRANSPORTE';
    if (x === 'ENTREGUE') return 'ENTREGUE';
    if (x === 'DEVOLVIDO') {
      return 'DEVOLVIDO';
    }
    if (x === 'CANCELADO') return 'CANCELADO';
    return 'EM PROCESSAMENTO';
  }

  private normalizePayment(p: any, status: OrderStatus): PaymentStatus {
    if (p) {
      const x = String(p).toUpperCase();
      if (x === 'PENDENTE') return 'PENDENTE';
      if (x === 'APROVADO') return 'APROVADO';
      if (x === 'REPROVADO') return 'REPROVADO';
      if (x === 'ESTORNADO') return 'ESTORNADO';
    }
    if (status === 'APROVADA') return 'APROVADO';
    if (status === 'REPROVADA') return 'REPROVADO';
    return 'PENDENTE';
  }
}
