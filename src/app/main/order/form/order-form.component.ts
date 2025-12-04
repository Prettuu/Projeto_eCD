import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService, Client } from '../../clients/clients.service';
import { StockService, Cd } from '../../stock/stock.service';
import { OrderService, Order } from '../order.service';
import { AuthService } from '../../../core/auth.service';
import { ExchangeService } from '../../sales/exchange.service';
import { ReturnService } from '../../sales/return.service';
import { CouponService } from '../../sales/coupon.service';
import { Exchange } from '../../../shared/model/sales/exchange';
import { Return } from '../../../shared/model/sales/return';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.scss']
})
export class OrderFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  clients: Client[] = [];
  cds: Cd[] = [];
  orderId?: number;
  viewMode = false;
  order?: Order;
  isClient = false;
  pendingExchanges: Exchange[] = [];
  pendingReturns: Return[] = [];
  clientExchanges: Exchange[] = [];
  clientReturns: Return[] = [];
  allExchanges: Exchange[] = [];
  allReturns: Return[] = [];
  private routeSubscription?: Subscription;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private clientsService: ClientService,
    public stockService: StockService,
    private orderService: OrderService,
    private auth: AuthService,
    private exchangeService: ExchangeService,
    private returnService: ReturnService,
    private couponService: CouponService
  ) {}

  ngOnInit(): void {
    console.log('OrderFormComponent.ngOnInit iniciado');

    this.isClient = this.auth.getRole() === 'CLIENT';
    
    this.viewMode = this.route.snapshot.data['viewMode'] === true;
    console.log('OrderFormComponent.viewMode:', this.viewMode);
    
    this.form = this.fb.group({
      clientId: [{ value: null, disabled: this.viewMode }, Validators.required],
      clientName: [{ value: '', disabled: true }],
      items: this.fb.array([]),
      total: [{ value: 0, disabled: true }],
      desconto: [{ value: 0, disabled: true }],
      cupom: [{ value: '', disabled: true }]
    });

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const newOrderId = Number(idParam);
        if (newOrderId !== this.orderId) {
          this.orderId = newOrderId;
          this.clientExchanges = [];
          this.clientReturns = [];
          this.allExchanges = [];
          this.allReturns = [];
          this.pendingExchanges = [];
          this.pendingReturns = [];
          this.order = undefined;
          this.loadOrderIfNeeded();
        } else if (this.orderId && this.order) {
          this.reloadExchangesAndReturns();
        }
      } else {
        this.orderId = undefined;
        this.order = undefined;
        this.clientExchanges = [];
        this.clientReturns = [];
        this.allExchanges = [];
        this.allReturns = [];
        this.pendingExchanges = [];
        this.pendingReturns = [];
      }
    });

    if (!this.isClient) {
      this.clientsService.getAll().subscribe(list => {
        this.clients = list;

        this.form.get('clientId')?.valueChanges.subscribe(id => {
          const c = this.clients.find(cl => cl.id === Number(id));
          this.form.get('clientName')?.setValue(c ? c.nome : '');
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
          this.orderId = Number(idParam);
          this.loadOrderIfNeeded();
        }
      });
    } else {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        this.orderId = Number(idParam);
      }
      
      this.clientsService.getAll().subscribe(list => {
        this.clients = list;
      });
    }

    this.stockService.getAll().subscribe({
      next: (cds) => {
        this.cds = cds;
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('OrderFormComponent.idParam:', idParam);
    if (!idParam) {
      this.addItem();
      this.recalcTotal();
    }
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private reloadExchangesAndReturns(): void {
    if (!this.orderId) return;

    if (this.viewMode && !this.isClient) {
      this.loadPendingExchangesAndReturns();
      this.loadAllExchangesAndReturns();
    }
    
    if (this.viewMode && this.isClient) {
      this.loadClientExchangesAndReturns();
    }
  }

  private loadOrderIfNeeded(): void {
    if (!this.orderId) return;

    this.orderService.getById(this.orderId).subscribe({
      next: (order) => {
        if (!order) {
          console.log('OrderFormComponent: pedido não encontrado, redirecionando');
          this.router.navigate(['/app/orders']);
          return;
        }
        this.order = order;

        if (this.viewMode && !this.isClient) {
          this.loadPendingExchangesAndReturns();
          this.loadAllExchangesAndReturns();
        }
        
        if (this.viewMode && this.isClient) {
          this.loadClientExchangesAndReturns();
        }

        const applyViewMode = () => {
          if (this.viewMode) {
            this.form.disable();

            this.items.controls.forEach(itemGroup => {
              itemGroup.get('cdId')?.enable({ emitEvent: false });
              itemGroup.get('titulo')?.enable({ emitEvent: false });
              itemGroup.get('quantidade')?.enable({ emitEvent: false });
              itemGroup.get('valorUnitario')?.enable({ emitEvent: false });
              itemGroup.get('subtotal')?.enable({ emitEvent: false });
            });
          }
        };

        if (!order.clientName && order.clientId) {

          const client = this.clients.find(c => c.id === order.clientId);
          if (client) {
            order.clientName = client.nome;
            this.loadFromOrder(order);
            applyViewMode();
          } else {

            this.clientsService.getById(order.clientId).subscribe({
              next: (client) => {
                if (client) {
                  order.clientName = client.nome;
                } else {
                  order.clientName = 'Cliente #' + order.clientId;
                }
                this.loadFromOrder(order);
                applyViewMode();
              },
              error: (err) => {
                console.warn('Erro ao buscar cliente:', err);
                order.clientName = 'Cliente #' + order.clientId;
                this.loadFromOrder(order);
                applyViewMode();
              }
            });
          }
        } else {

          this.loadFromOrder(order);
          applyViewMode();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar pedido:', err);
        this.router.navigate(['/app/orders']);
      }
    });
  }

  private getStockQty(cdId: number | null | undefined): number {
    if (!cdId) return 0;
    const cd = this.stockService.getByIdSync(Number(cdId));
    return Number(cd?.estoque ?? 0);
  }

  private clampQtyToStock(group: FormGroup): void {
    const cdId = Number(group.get('cdId')?.value ?? 0);
    const max = this.getStockQty(cdId);
    let qtd = Number(group.get('quantidade')?.value ?? 0);

    if (qtd > max) {
      group.get('quantidade')?.setValue(max);
      qtd = max;
    }

    if (max <= 0) {
      const errs = { ...(group.get('quantidade')?.errors ?? {}) };
      errs['estoqueInsuficiente'] = true;
      group.get('quantidade')?.setErrors(errs);
    } else {
      const errs = { ...(group.get('quantidade')?.errors ?? {}) };
      delete errs['estoqueInsuficiente'];
      group.get('quantidade')?.setErrors(Object.keys(errs).length ? errs : null);
    }
  }

  private buildItemGroup(item?: any, isReadonly: boolean = false): FormGroup {
    const cdId = item?.cdId ?? item?.productId ?? null;
    const titulo = item?.titulo ?? '';
    
    const quantidade = item?.quantidade != null ? Number(item.quantidade) : 1;
    const valorUnitario = item?.valorUnitario != null 
      ? (typeof item.valorUnitario === 'string' ? parseFloat(item.valorUnitario) : Number(item.valorUnitario))
      : 0;
    const subtotal = item?.subtotal != null 
      ? (typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : Number(item.subtotal))
      : 0;
    
    console.log('buildItemGroup - item:', item);
    console.log('buildItemGroup - cdId:', cdId, 'titulo:', titulo, 'quantidade:', quantidade, 'valorUnitario:', valorUnitario, 'subtotal:', subtotal);

    const group = this.fb.group({
      cdId: [cdId, isReadonly ? [] : Validators.required],
      titulo: [titulo],
      quantidade: [quantidade, isReadonly ? [] : [Validators.required, Validators.min(1)]],
      valorUnitario: [valorUnitario],
      subtotal: [subtotal]
    });
    
    if (isReadonly) {
      group.disable({ emitEvent: false });
    }

    group.get('cdId')?.valueChanges.subscribe(id => {
      const cd = this.cds.find(x => x.id === Number(id));
      group.get('titulo')?.setValue(cd?.titulo ?? '');
      group.get('valorUnitario')?.setValue(cd?.valorVenda ?? 0);

      this.clampQtyToStock(group);
      this.recalcItem(group);
      this.recalcTotal();
    });

    group.get('quantidade')?.valueChanges.subscribe(() => {
      this.clampQtyToStock(group);
      this.recalcItem(group);
      this.recalcTotal();
    });

    return group;
  }

  private loadFromOrder(order: Order): void {
    console.log('loadFromOrder - order:', order);
    console.log('loadFromOrder - order.items:', order.items);
    console.log('loadFromOrder - order.items length:', order.items?.length);
    
    this.form.get('clientId')?.setValue(order.clientId);

    const clientNameControl = this.form.get('clientName');
    if (clientNameControl?.disabled) {
      clientNameControl.enable({ emitEvent: false });
    }
    clientNameControl?.setValue(order.clientName || 'Cliente');
    if (this.viewMode || true) {
      clientNameControl?.disable({ emitEvent: false });
    }
    
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }
    
    const orderItems = order.items ?? [];
    console.log('loadFromOrder - orderItems:', orderItems);
    console.log('loadFromOrder - orderItems length:', orderItems.length);
    
    if (orderItems.length === 0) {
      console.warn('loadFromOrder - Nenhum item encontrado no pedido!');
    }
    
    orderItems.forEach((it, index) => {
      console.log(`loadFromOrder - item ${index}:`, it);
      console.log(`loadFromOrder - item ${index} - cdId:`, it.cdId, 'productId:', it.productId);
      console.log(`loadFromOrder - item ${index} - titulo:`, it.titulo);
      console.log(`loadFromOrder - item ${index} - quantidade:`, it.quantidade);
      console.log(`loadFromOrder - item ${index} - valorUnitario:`, it.valorUnitario);
      console.log(`loadFromOrder - item ${index} - subtotal:`, it.subtotal);
      
      const itemGroup = this.buildItemGroup(it, this.viewMode);
      this.items.push(itemGroup);
      
      console.log(`loadFromOrder - itemGroup ${index} após criação:`, {
        cdId: itemGroup.get('cdId')?.value,
        titulo: itemGroup.get('titulo')?.value,
        quantidade: itemGroup.get('quantidade')?.value,
        valorUnitario: itemGroup.get('valorUnitario')?.value,
        subtotal: itemGroup.get('subtotal')?.value
      });
    });
    
    console.log('loadFromOrder - Total de items no form:', this.items.length);
    
    this.form.get('total')?.setValue(order.total ?? 0);
    this.form.get('desconto')?.setValue(order.desconto ?? 0);
    this.form.get('cupom')?.setValue(order.cupom ?? '');
  }

  addItem(): void {
    this.items.push(this.buildItemGroup());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.recalcTotal();
  }

  private recalcItem(group: FormGroup): void {
    const qtd = Number(group.get('quantidade')?.value || 0);
    const vu = Number(group.get('valorUnitario')?.value || 0);
    group.get('subtotal')?.setValue(qtd * vu);
  }

  private recalcTotal(): void {
    const total = this.items.controls.reduce((sum, g) =>
      sum + Number(g.get('subtotal')?.value || 0), 0);
    this.form.get('total')?.setValue(total);
  }

  save(): void {
    if (this.viewMode || this.form.invalid || !this.items.length) {
      this.form.markAllAsTouched();
      return;
    }

    const excedeu = this.items.controls.some(g => {
      const cdId = Number(g.get('cdId')?.value ?? 0);
      const qtd = Number(g.get('quantidade')?.value ?? 0);
      return qtd > this.getStockQty(cdId);
    });
    if (excedeu) {
      alert('Há itens com quantidade acima do estoque.');
      return;
    }

    const clientId = Number(this.form.get('clientId')?.value);
    const client = this.clients.find(c => c.id === clientId);

    const items = this.items.controls.map(g => ({
      cdId: Number(g.get('cdId')?.value),
      titulo: String(g.get('titulo')?.value),
      quantidade: Number(g.get('quantidade')?.value),
      valorUnitario: Number(g.get('valorUnitario')?.value),
      subtotal: Number(g.get('subtotal')?.value),
    }));

    const total = Number(this.form.get('total')?.value);
    const desconto = Number(this.form.get('desconto')?.value || 0);
    const cupom = this.form.get('cupom')?.value || null;

    if (this.orderId) {

      const existing = this.orderService.getByIdSync(this.orderId);
      if (!existing) {
        alert('Pedido não encontrado');
        return;
      }
      const payload: any = {
        id: this.orderId,
        clientId,
        clientName: client?.nome || 'Cliente',
        items,
        total,
        desconto,
        cupom,
        status: existing.status,
        paymentStatus: existing.paymentStatus,
        createdAt: existing.createdAt
      };
      this.orderService.update(payload);
      this.router.navigate(['/app/orders'], { replaceUrl: true });
    } else {

      const createPayload: any = {
        clientId,
        clientName: client?.nome || 'Cliente',
        items,
        total,
        desconto,
        cupom
      };
      this.orderService.create(createPayload).subscribe({
        next: () => {
          this.router.navigate(['/app/orders'], { replaceUrl: true });
        },
        error: (err) => {
          console.error('Erro ao criar pedido:', err);
          alert('Erro ao criar pedido. Tente novamente.');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/app/orders']);
  }

  getStatusClass(status: string): string {
    const statusLower = (status || '').toLowerCase().replace(/\s+/g, '-');
    if (statusLower.includes('aberto') || statusLower.includes('pendente')) return 'em-aberto';
    if (statusLower.includes('aprovada')) return 'aprovada';
    if (statusLower.includes('cancelada')) return 'cancelada';
    if (statusLower.includes('processando')) return 'processando';
    return '';
  }

  getPaymentClass(paymentStatus: string): string {
    const statusLower = (paymentStatus || '').toLowerCase().replace(/\s+/g, '-');
    if (statusLower.includes('pendente')) return 'pendente';
    if (statusLower.includes('aprovado') || statusLower.includes('pago')) return 'aprovado';
    if (statusLower.includes('cancelado')) return 'cancelado';
    return '';
  }

  loadPendingExchangesAndReturns(): void {
    if (!this.orderId) return;

    this.exchangeService.getAll(undefined, 'PENDENTE').subscribe({
      next: (exchanges) => {
        this.pendingExchanges = exchanges.filter(ex => ex.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar trocas:', err)
    });

    this.returnService.getAll(undefined, 'PENDENTE').subscribe({
      next: (returns) => {
        this.pendingReturns = returns.filter(ret => ret.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar devoluções:', err)
    });
  }

  loadAllExchangesAndReturns(): void {
    if (!this.orderId) return;

    this.exchangeService.getAll().subscribe({
      next: (exchanges) => {
        this.allExchanges = exchanges.filter(ex => ex.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar todas as trocas:', err)
    });

    this.returnService.getAll().subscribe({
      next: (returns) => {
        this.allReturns = returns.filter(ret => ret.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar todas as devoluções:', err)
    });
  }

  loadClientExchangesAndReturns(): void {
    if (!this.orderId || !this.order) return;
    
    const clientId = this.order.clientId;

    this.exchangeService.getAll(clientId).subscribe({
      next: (exchanges) => {
        this.clientExchanges = exchanges.filter(ex => ex.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar trocas do cliente:', err)
    });

    this.returnService.getAll(clientId).subscribe({
      next: (returns) => {
        this.clientReturns = returns.filter(ret => ret.orderId === this.orderId);
      },
      error: (err) => console.error('Erro ao carregar devoluções do cliente:', err)
    });
  }

  getStatusClassForClient(status: string): string {
    switch (status) {
      case 'PENDENTE': return 'status-pending';
      case 'APROVADA': return 'status-approved';
      case 'NEGADA': return 'status-rejected';
      case 'CONCLUIDA': return 'status-completed';
      case 'CANCELADA': return 'status-cancelled';
      default: return 'status-default';
    }
  }

  hasApprovedOrCompletedExchangeOrReturn(): boolean {
    if (this.order && this.order.status === 'DEVOLVIDO') {
      return true;
    }

    const hasExchange = this.clientExchanges.some(ex => 
      ex.status === 'PENDENTE' || 
      ex.status === 'APROVADA' || 
      ex.status === 'TROCA EM ANDAMENTO' || 
      ex.status === 'CONCLUIDA'
    );

    const hasReturn = this.clientReturns.some(ret => 
      ret.status === 'PENDENTE' || 
      ret.status === 'APROVADA' || 
      ret.status === 'CONCLUIDA'
    );

    return hasExchange || hasReturn;
  }

  approveExchange(exchange: Exchange): void {
    if (!confirm('Deseja aprovar esta solicitação de troca? A troca entrará em andamento e aguardará o retorno do produto.')) return;
    
    this.exchangeService.approve(exchange.id).subscribe({
      next: (updatedExchange) => {
        alert('Troca aprovada! Status alterado para TROCA EM ANDAMENTO. Aguarde o retorno do produto para gerar o cupom.');
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
        this.loadClientExchangesAndReturns();
        if (this.order) {
          this.orderService.getById(this.order.id).subscribe(order => {
            this.order = order;
          });
        }
      },
      error: (err) => {
        console.error('Erro ao aprovar troca:', err);
        alert('Erro ao aprovar troca. Tente novamente.');
      }
    });
  }

  rejectExchange(exchange: Exchange): void {
    if (!confirm('Deseja negar esta solicitação de troca?')) return;
    
    this.exchangeService.reject(exchange.id).subscribe({
      next: () => {
        alert('Troca negada com sucesso!');
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
      },
      error: (err) => {
        console.error('Erro ao negar troca:', err);
        alert('Erro ao negar troca. Tente novamente.');
      }
    });
  }

  confirmExchangeReceived(exchange: Exchange): void {
    if (!confirm('Deseja confirmar o recebimento dos produtos devolvidos? O cupom CUPOMTROCA ficará disponível para uso.')) return;
    
    this.exchangeService.confirmReceived(exchange.id).subscribe({
      next: (updatedExchange) => {
        const generatedCoupon = (updatedExchange as any).generatedCoupon;
        const orderTotal = (updatedExchange as any).orderTotal || 0;
        
        if (generatedCoupon && generatedCoupon.code) {
          alert(`Recebimento confirmado com sucesso!\n\n🎫 Cupom de Troca Gerado:\n\nCódigo: ${generatedCoupon.code}\nValor: R$ ${generatedCoupon.value.toFixed(2)}\n\nEste cupom pode ser usado em uma única compra.`);
        } else if (orderTotal > 0) {
          this.couponService.resetExchangeCouponStatus();
          this.couponService.setExchangeCouponValue(orderTotal);
          alert(`Recebimento confirmado com sucesso!\n\n🎫 Cupom de Troca Disponível: CUPOMTROCA\n\nValor: R$ ${orderTotal.toFixed(2)}\n\nEste cupom pode ser usado em uma única compra.`);
        } else {
          alert('Recebimento confirmado com sucesso!\n\nO cupom será gerado em breve.');
        }
        
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
        this.loadClientExchangesAndReturns();
        
        if (this.order) {
          this.orderService.getById(this.order.id).subscribe(order => {
            this.order = order;
          });
        }
      },
      error: (err) => {
        console.error('Erro ao confirmar recebimento:', err);
        const errorMessage = err?.error?.message || 'Erro ao confirmar recebimento. Tente novamente.';
        alert(errorMessage);
      }
    });
  }

  approveReturn(returnRequest: Return): void {
    if (!confirm('Deseja aprovar esta solicitação de devolução?')) return;
    
    this.returnService.approve(returnRequest.id).subscribe({
      next: () => {
        alert('Devolução aprovada com sucesso!');
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
        this.loadClientExchangesAndReturns();
        if (this.order) {
          this.orderService.getById(this.order.id).subscribe(order => {
            this.order = order;
          });
        }
      },
      error: (err) => {
        console.error('Erro ao aprovar devolução:', err);
        alert('Erro ao aprovar devolução. Tente novamente.');
      }
    });
  }

  rejectReturn(returnRequest: Return): void {
    if (!confirm('Deseja negar esta solicitação de devolução?')) return;
    
    this.returnService.reject(returnRequest.id).subscribe({
      next: () => {
        alert('Devolução negada com sucesso!');
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
        this.loadClientExchangesAndReturns();
      },
      error: (err) => {
        console.error('Erro ao negar devolução:', err);
        alert('Erro ao negar devolução. Tente novamente.');
      }
    });
  }

  confirmReturnReceived(returnRequest: Return): void {
    if (!confirm('Deseja confirmar o recebimento dos produtos devolvidos? O pedido será cancelado e os itens retornarão ao estoque.')) return;
    
    this.returnService.confirmReceived(returnRequest.id).subscribe({
      next: () => {
        alert('Recebimento confirmado! A devolução foi concluída e o pedido foi cancelado.');
        this.loadPendingExchangesAndReturns();
        this.loadAllExchangesAndReturns();
        this.loadClientExchangesAndReturns();
        if (this.order) {
          this.orderService.getById(this.order.id).subscribe(order => {
            this.order = order;
          });
        }
      },
      error: (err) => {
        console.error('Erro ao confirmar recebimento:', err);
        alert('Erro ao confirmar recebimento. Tente novamente.');
      }
    });
  }

  confirmDelivery(): void {
    if (!this.order) return;
    
    if (!confirm('Deseja confirmar que recebeu o pedido?')) return;
    
    this.orderService.updateStatus(this.order.id, 'ENTREGUE').subscribe({
      next: (updatedOrder) => {
        alert('Entrega confirmada com sucesso!');
        this.order = updatedOrder;
        this.loadOrderIfNeeded();
      },
      error: (err) => {
        console.error('Erro ao confirmar entrega:', err);
        alert('Erro ao confirmar entrega. Tente novamente.');
      }
    });
  }

  approveProcessing(): void {
    if (!this.order) return;

    if (!confirm('Deseja aprovar este pedido e enviá-lo para transporte? O status de pagamento será alterado para APROVADO.')) return;

    this.orderService.updateStatus(this.order.id, 'EM TRANSPORTE', 'APROVADO').subscribe({
      next: (updatedOrder) => {
        alert('Pedido aprovado e enviado para transporte! Status de pagamento alterado para APROVADO.');
        this.order = updatedOrder;
        this.loadOrderIfNeeded();
      },
      error: (err) => {
        console.error('Erro ao aprovar pedido:', err);
        alert('Erro ao aprovar pedido. Tente novamente.');
      }
    });
  }

  rejectProcessing(): void {
    if (!this.order) return;
    
    if (!confirm('Deseja recusar este pedido? O pedido será cancelado.')) return;
    
    this.orderService.updateStatus(this.order.id, 'CANCELADO').subscribe({
      next: (updatedOrder) => {
        alert('Pedido recusado e cancelado.');
        this.order = updatedOrder;
        this.loadOrderIfNeeded();
      },
      error: (err) => {
        console.error('Erro ao recusar pedido:', err);
        alert('Erro ao recusar pedido. Tente novamente.');
      }
    });
  }

  isExchangeCouponAvailable(): boolean {
    return this.couponService.isExchangeCouponAvailable();
  }

  getExchangeCouponValue(): number {
    try {
      const storedValue = localStorage.getItem('exchange_coupon_value');
      const value = storedValue ? parseFloat(storedValue) : 0;
      
      if (value === 0 && this.order) {
        return this.order.total || 0;
      }
      
      return value;
    } catch {
      return this.order?.total || 0;
    }
  }

  getExchangeCouponValueForExchange(exchange: Exchange): number {
    if (exchange.generatedCoupon && exchange.generatedCoupon.value) {
      return exchange.generatedCoupon.value;
    }
    
    try {
      const storedValue = localStorage.getItem('exchange_coupon_value');
      if (storedValue) {
        const value = parseFloat(storedValue);
        if (value > 0) {
          return value;
        }
      }
      
      if (this.order && this.order.id === exchange.orderId) {
        return this.order.total || 0;
      }
    } catch {
    }
    
    return 0;
  }

  getExchangeCouponCode(exchange?: Exchange): string {
    if (exchange?.generatedCoupon?.code) {
      return exchange.generatedCoupon.code;
    }
    
    if (exchange?.couponGenerated) {
      return exchange.couponGenerated;
    }
    
    return 'CUPOMTROCA';
  }

  isExchangeCouponUsed(exchange?: Exchange): boolean {
    if (exchange?.generatedCoupon) {
      return exchange.generatedCoupon.used;
    }
    
    try {
      const stored = localStorage.getItem('used_exchange_coupons');
      const used = stored ? JSON.parse(stored) : [];
      return used.includes('CUPOMTROCA');
    } catch {
      return false;
    }
  }
}
