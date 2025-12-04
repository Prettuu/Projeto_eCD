import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Order, OrderService } from './order.service';
import { AuthService } from '../../core/auth.service';
import { ExchangeService } from '../sales/exchange.service';
import { ReturnService } from '../sales/return.service';
import { Exchange } from '../../shared/model/sales/exchange';
import { Return } from '../../shared/model/sales/return';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  orders: Order[] = [];
  isProfileMode = false; // If true, show only current user's orders
  exchanges: Exchange[] = [];
  returns: Return[] = [];
  orderExchangesMap: Map<number, Exchange[]> = new Map();
  orderReturnsMap: Map<number, Return[]> = new Map();
  allClientExchanges: Exchange[] = [];
  allClientReturns: Return[] = [];
  clientExchangesMap: Map<number, Exchange[]> = new Map();
  clientReturnsMap: Map<number, Return[]> = new Map();

  constructor(
    private orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private exchangeService: ExchangeService,
    private returnService: ReturnService
  ) {}

  ngOnInit(): void {
    this.isProfileMode = this.auth.isClient();
    this.reload();
  }

  reload(): void {
    this.orderService.getAll().subscribe({
      next: (allOrders) => {
        if (this.isProfileMode) {
          const clientId = this.auth.getClientId();
          const userId = this.auth.getUserId();
          const targetId = clientId || userId;
          
          if (targetId) {
            this.orders = allOrders.filter(order => order.clientId === targetId);
          } else {
            console.warn('Client ID or User ID not found for filtering orders');
            this.orders = [];
          }
        } else {
          this.orders = allOrders;
        }
        
        if (!this.isProfileMode) {
          this.loadPendingExchangesAndReturns();
        }
        
        if (this.isProfileMode) {
          this.loadClientExchangesAndReturns();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar pedidos:', err);
        this.orders = [];
      }
    });
  }

  loadPendingExchangesAndReturns(): void {
    this.exchangeService.getAll(undefined, 'PENDENTE').subscribe({
      next: (exchanges) => {
        this.exchanges = exchanges;
        this.orderExchangesMap.clear();
        exchanges.forEach(ex => {
          if (!this.orderExchangesMap.has(ex.orderId)) {
            this.orderExchangesMap.set(ex.orderId, []);
          }
          this.orderExchangesMap.get(ex.orderId)!.push(ex);
        });
      },
      error: (err) => console.error('Erro ao carregar trocas:', err)
    });

    this.returnService.getAll(undefined, 'PENDENTE').subscribe({
      next: (returns) => {
        this.returns = returns;
        this.orderReturnsMap.clear();
        returns.forEach(ret => {
          if (!this.orderReturnsMap.has(ret.orderId)) {
            this.orderReturnsMap.set(ret.orderId, []);
          }
          this.orderReturnsMap.get(ret.orderId)!.push(ret);
        });
      },
      error: (err) => console.error('Erro ao carregar devoluções:', err)
    });
  }

  getPendingExchangeStatus(orderId: number): string | null {
    const exchanges = this.orderExchangesMap.get(orderId);
    if (exchanges && exchanges.length > 0) {
      return 'Aguardando Troca';
    }
    return null;
  }

  getPendingReturnStatus(orderId: number): string | null {
    const returns = this.orderReturnsMap.get(orderId);
    if (returns && returns.length > 0) {
      return 'Aguardando Devolução';
    }
    return null;
  }

  loadClientExchangesAndReturns(): void {
    const clientId = this.auth.getClientId();
    const userId = this.auth.getUserId();
    const targetId = clientId || userId;
    
    if (!targetId) return;

    this.exchangeService.getAll(targetId).subscribe({
      next: (exchanges) => {
        this.allClientExchanges = exchanges;
        this.clientExchangesMap.clear();
        exchanges.forEach(ex => {
          if (!this.clientExchangesMap.has(ex.orderId)) {
            this.clientExchangesMap.set(ex.orderId, []);
          }
          this.clientExchangesMap.get(ex.orderId)!.push(ex);
        });
      },
      error: (err) => console.error('Erro ao carregar trocas do cliente:', err)
    });

    this.returnService.getAll(targetId).subscribe({
      next: (returns) => {
        this.allClientReturns = returns;
        this.clientReturnsMap.clear();
        returns.forEach(ret => {
          if (!this.clientReturnsMap.has(ret.orderId)) {
            this.clientReturnsMap.set(ret.orderId, []);
          }
          this.clientReturnsMap.get(ret.orderId)!.push(ret);
        });
      },
      error: (err) => console.error('Erro ao carregar devoluções do cliente:', err)
    });
  }

  getClientExchangeStatus(orderId: number): string | null {
    const exchanges = this.clientExchangesMap.get(orderId);
    if (!exchanges || exchanges.length === 0) return null;
    
    const negada = exchanges.find(ex => ex.status === 'NEGADA');
    if (negada) return 'Troca Negada';
    
    const aprovada = exchanges.find(ex => ex.status === 'APROVADA');
    if (aprovada) return 'Troca Aprovada';
    
    const pendente = exchanges.find(ex => ex.status === 'PENDENTE');
    if (pendente) return 'Aguardando Troca';
    
    return null;
  }

  getClientReturnStatus(orderId: number): string | null {
    const returns = this.clientReturnsMap.get(orderId);
    if (!returns || returns.length === 0) return null;
    
    const negada = returns.find(ret => ret.status === 'NEGADA');
    if (negada) return 'Devolução Negada';
    
    const aprovada = returns.find(ret => ret.status === 'APROVADA');
    if (aprovada) return 'Devolução Aprovada';
    
    const pendente = returns.find(ret => ret.status === 'PENDENTE');
    if (pendente) return 'Aguardando Devolução';
    
    return null;
  }

  getClientStatusClass(status: string): string {
    if (status.includes('Negada')) return 'status-rejected';
    if (status.includes('Aprovada')) return 'status-approved';
    if (status.includes('Aguardando')) return 'status-pending';
    return 'status-default';
  }

  newOrder(): void {
    this.router.navigate(['/app/orders/new']);
  }

  view(order: Order): void {
    console.log('OrderComponent.view: navegando para pedido', order.id);
    this.router.navigate(['/app/orders/view', order.id]);
  }

  markPaid(order: Order): void {
    this.orderService.updateStatus(order.id, 'APROVADA', 'APROVADO').subscribe({
      next: () => this.reload(),
      error: (err) => {
        console.error('Erro ao marcar como pago:', err);
        alert('Erro ao atualizar status do pedido');
      }
    });
  }

  cancel(order: Order): void {
    if (!confirm(`Cancelar o pedido #${order.id}?`)) return;
    this.orderService.transition(order.id, 'CANCELADO', 'operador').subscribe({
      next: (success) => {
        if (success) {
          this.reload();
        } else {
          alert('Não foi possível cancelar o pedido');
        }
      },
      error: (err) => {
        console.error('Erro ao cancelar pedido:', err);
        alert('Erro ao cancelar pedido');
      }
    });
  }

  send(order: Order): void {
    this.orderService.transition(order.id, 'TRANSPORTE', 'operador').subscribe({
      next: (success) => {
        if (!success) alert('Transição inválida (Enviar)');
        this.reload();
      },
      error: (err) => {
        console.error('Erro ao enviar pedido:', err);
        alert('Erro ao atualizar status do pedido');
      }
    });
  }

  deliver(order: Order): void {
    this.orderService.transition(order.id, 'ENTREGUE', 'operador').subscribe({
      next: (success) => {
        if (!success) alert('Transição inválida (Confirmar entrega)');
        this.reload();
      },
      error: (err) => {
        console.error('Erro ao confirmar entrega:', err);
        alert('Erro ao atualizar status do pedido');
      }
    });
  }

  remove(order: Order): void {
    if (!confirm(`Excluir o pedido #${order.id}?`)) return;
    this.orderService.delete(order.id).subscribe({
      next: (success) => {
        if (success) {
          this.reload();
        } else {
          alert('Erro ao excluir pedido. Tente novamente.');
        }
      },
      error: (err) => {
        console.error('Erro ao excluir pedido:', err);
        alert('Erro ao excluir pedido. Tente novamente.');
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EM ABERTO': 'status-em-aberto',
      'PROCESSANDO': 'status-processando',
      'APROVADA': 'status-aprovada',
      'REPROVADA': 'status-reprovada',
      'TRANSPORTE': 'status-transporte',
      'ENTREGUE': 'status-entregue',
      'CANCELADO': 'status-cancelado'
    };
    return statusMap[status] || 'status-default';
  }

  getPaymentClass(paymentStatus: string): string {
    const paymentMap: { [key: string]: string } = {
      'PENDENTE': 'payment-pendente',
      'APROVADO': 'payment-aprovado',
      'RECUSADO': 'payment-recusado'
    };
    return paymentMap[paymentStatus] || 'payment-default';
  }
}
