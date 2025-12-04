import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { 
  CartItem, 
  CartSummary, 
  Order, 
  OrderItem, 
  OrderStatus, 
  PaymentStatus,
  PaymentMethod,
  Coupon,
  CreditCard,
  DeliveryAddress
} from '../../shared/model/sales/sales';
import { CouponService } from './coupon.service';
import { PaymentService } from './payment.service';
import { DeliveryService } from './delivery.service';
import { StockService } from '../stock/stock.service';
import { ExchangeCouponService } from './exchange-coupon.service';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private currentClientId: number | null = null;
  private appliedCoupons: Coupon[] = [];
  private localCheckoutCoupon: Coupon | null = null;
  private selectedAddress: DeliveryAddress | null = null;
  private paymentMethods: PaymentMethod[] = [];
  private shippingValue = 0;

  constructor(
    private couponService: CouponService,
    private paymentService: PaymentService,
    private deliveryService: DeliveryService,
    private stockService: StockService,
    private http: HttpClient,
    private exchangeCouponService: ExchangeCouponService
  ) {
    this.loadOrders();
  }

  private loadOrders(): void {
    const saved = localStorage.getItem('orders_v2');
    if (saved) {
      try {
        const orders = JSON.parse(saved);
        this.ordersSubject.next(orders);
      } catch {
        this.ordersSubject.next([]);
      }
    }
  }

  private saveOrders(): void {
    localStorage.setItem('orders_v2', JSON.stringify(this.ordersSubject.value));
  }

  setClient(clientId: number | null): void {
    this.currentClientId = clientId;
    if (!clientId) {
      this.clearCart();
    }
  }

  getCurrentClientId(): number | null {
    return this.currentClientId;
  }

  addToCart(item: Omit<CartItem, 'clientId'>): { success: boolean; error?: string } {
    if (!this.currentClientId) {
      return { success: false, error: 'Cliente não selecionado' };
    }

    const cd = this.stockService.getByIdSync(item.cdId);
    if (!cd || !cd.ativo) {
      return { success: false, error: 'Produto não disponível' };
    }

    const currentQuantity = this.getCartItemQuantity(item.cdId);
    if (currentQuantity + item.quantidade > cd.estoque) {
      return { success: false, error: 'Quantidade indisponível em estoque' };
    }

    const cartItem: CartItem = {
      ...item,
      clientId: this.currentClientId
    };

    const cart = this.cartSubject.value;
    const existingIndex = cart.findIndex(
      c => c.cdId === item.cdId && c.clientId === this.currentClientId
    );

    if (existingIndex >= 0) {
      cart[existingIndex].quantidade += item.quantidade;
    } else {
      cart.push(cartItem);
    }

    this.cartSubject.next([...cart]);
    return { success: true };
  }

  updateCartItemQuantity(cdId: number, quantity: number): { success: boolean; error?: string } {
    if (!this.currentClientId) return { success: false, error: 'Cliente não selecionado' };

    if (quantity <= 0) {
      return this.removeFromCart(cdId);
    }

    const cd = this.stockService.getByIdSync(cdId);
    if (!cd || !cd.ativo) {
      return { success: false, error: 'Produto não disponível' };
    }

    if (quantity > cd.estoque) {
      return { success: false, error: 'Quantidade indisponível em estoque' };
    }

    const cart = this.cartSubject.value;
    const index = cart.findIndex(
      c => c.cdId === cdId && c.clientId === this.currentClientId
    );

    if (index >= 0) {
      cart[index].quantidade = quantity;
      this.cartSubject.next([...cart]);
      return { success: true };
    }

    return { success: false, error: 'Item não encontrado no carrinho' };
  }

  removeFromCart(cdId: number): { success: boolean; error?: string } {
    if (!this.currentClientId) return { success: false, error: 'Cliente não selecionado' };

    const cart = this.cartSubject.value;
    const filteredCart = cart.filter(
      c => !(c.cdId === cdId && c.clientId === this.currentClientId)
    );

    this.cartSubject.next(filteredCart);
    return { success: true };
  }

  clearCart(): void {
    this.cartSubject.next([]);
    this.appliedCoupons = [];
    this.localCheckoutCoupon = null;
    this.selectedAddress = null;
    this.paymentMethods = [];
    this.shippingValue = 0;
    this.couponService.clearCurrentOrderCoupons();
  }

  getCartItems(): CartItem[] {
    if (!this.currentClientId) return [];
    return this.cartSubject.value.filter(item => item.clientId === this.currentClientId);
  }

  getCartItemQuantity(cdId: number): number {
    const item = this.getCartItems().find(i => i.cdId === cdId);
    return item ? item.quantidade : 0;
  }

  applyCoupon(code: string): Observable<{ success: boolean; coupon?: Coupon; error?: string }> {
    const cartItems = this.getCartItems();
    if (cartItems.length === 0) {
      return new Observable(observer => {
        observer.next({ success: false, error: 'Carrinho vazio' });
        observer.complete();
      });
    }

    const subtotal = this.calculateSubtotal();
    
    if (code.toUpperCase().startsWith('TROCA')) {
      return this.applyExchangeCoupon(code, subtotal);
    }

    const validation = this.couponService.validateCoupon(code, subtotal);
    
    if (!validation.valid) {
      return new Observable(observer => {
        observer.next({ success: false, error: validation.error });
        observer.complete();
      });
    }

    const coupon = validation.coupon!;

    if (this.appliedCoupons.find(c => c.id === coupon.id)) {
      return new Observable(observer => {
        observer.next({ success: false, error: 'Cupom já aplicado' });
        observer.complete();
      });
    }

    this.appliedCoupons.push(coupon);
    return new Observable(observer => {
      observer.next({ success: true, coupon });
      observer.complete();
    });
  }

  private applyExchangeCoupon(code: string, subtotal: number): Observable<{ success: boolean; coupon?: Coupon; error?: string }> {
    if (!this.currentClientId) {
      return new Observable(observer => {
        observer.next({ success: false, error: 'Cliente não selecionado' });
        observer.complete();
      });
    }

    return this.exchangeCouponService.validateCoupon(code, this.currentClientId).pipe(
      map(validation => {
        if (!validation || !validation.valid) {
          return { success: false, error: validation?.error || 'Cupom inválido' };
        }

        if (!validation.coupon) {
          return { success: false, error: 'Cupom não encontrado' };
        }

        const coupon: Coupon = {
          id: code,
          code: code.toUpperCase(),
          type: 'EXCHANGE',
          value: validation.coupon.value,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          usedCount: 0,
          maxUses: 1,
          isActive: true
        };

        if (this.appliedCoupons.find(c => c.id === coupon.id)) {
          return { success: false, error: 'Cupom já aplicado' };
        }

        this.appliedCoupons.push(coupon);
        return { success: true, coupon };
      })
    );
  }

  removeCoupon(couponId: string): boolean {
    const index = this.appliedCoupons.findIndex(c => c.id === couponId);
    if (index >= 0) {
      this.appliedCoupons.splice(index, 1);
      return true;
    }
    return false;
  }

  getAppliedCoupons(): Coupon[] {
    return [...this.appliedCoupons];
  }

  setDeliveryAddress(address: DeliveryAddress): void {
    this.selectedAddress = address;
    this.calculateShipping();
  }

  getDeliveryAddress(): DeliveryAddress | null {
    return this.selectedAddress;
  }

  private async calculateShipping(): Promise<void> {
    if (!this.selectedAddress) {
      this.shippingValue = 0;
      return;
    }

    const totalWeight = this.getCartItems().reduce((sum, item) => sum + item.quantidade, 0);
    
    try {
      const shipping = await this.deliveryService.calculateShipping(
        this.selectedAddress.zipCode,
        totalWeight
      );
      this.shippingValue = shipping.value;
    } catch {
      this.shippingValue = 15;
    }
  }

  addPaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethods.push(paymentMethod);
  }

  removePaymentMethod(index: number): void {
    this.paymentMethods.splice(index, 1);
  }

  getPaymentMethods(): PaymentMethod[] {
    return [...this.paymentMethods];
  }

  getCartSummary(): CartSummary {
    const cartItems = this.getCartItems();
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateDiscount();
    const total = subtotal - discount + this.shippingValue;

    return {
      clientId: this.currentClientId,
      items: cartItems,
      subtotal,
      discount,
      shipping: this.shippingValue,
      coupons: this.appliedCoupons,
      total,
      deliveryAddress: this.selectedAddress || undefined,
      paymentMethods: this.paymentMethods
    };
  }

  private calculateSubtotal(): number {
    return this.getCartItems().reduce(
      (sum, item) => sum + (item.valorUnitario * item.quantidade),
      0
    );
  }

  private calculateDiscount(): number {
    const subtotal = this.calculateSubtotal();
    const appliedDiscount = this.appliedCoupons.reduce((totalDiscount, coupon) => {
      return totalDiscount + this.couponService.calculateDiscount(coupon, subtotal);
    }, 0);
    
    return appliedDiscount;
  }

  setLocalCheckoutCoupon(couponCode: string): { success: boolean; error?: string } {
    if (!couponCode || couponCode.trim() === '') {
      return { success: false, error: 'Código do cupom não informado' };
    }

    const codeUpper = couponCode.toUpperCase().trim();
    
    if (codeUpper === 'COMPRA1') {
      const subtotal = this.calculateSubtotal();
      
      const coupon = this.couponService.getCouponByCode(codeUpper);
      if (!coupon || !coupon.isActive) {
        return { success: false, error: 'Cupom não encontrado ou inativo' };
      }

      const usedInCurrentOrder = this.couponService.isCouponUsedInCurrentOrder(codeUpper);
      if (usedInCurrentOrder) {
        return { success: false, error: 'Este cupom já foi utilizado neste pedido' };
      }

      this.localCheckoutCoupon = {
        ...coupon,
        isLocal: true,
        type: 'FINAL_CHECKOUT',
        validUntil: new Date('2099-12-31')
      };

      return { success: true };
    }

    return { success: false, error: 'Este cupom não pode ser usado como cupom local' };
  }

  clearLocalCheckoutCoupon(): void {
    this.localCheckoutCoupon = null;
  }

  getLocalCheckoutCoupon(): Coupon | null {
    return this.localCheckoutCoupon;
  }

  async finalizeOrder(): Promise<{ success: boolean; order?: Order; error?: string }> {
    const summary = this.getCartSummary();
    
    if (!summary.clientId) {
      return { success: false, error: 'Cliente não selecionado' };
    }

    if (summary.items.length === 0) {
      return { success: false, error: 'Carrinho vazio' };
    }

    if (!summary.deliveryAddress) {
      return { success: false, error: 'Endereço de entrega não selecionado' };
    }

    if (summary.paymentMethods.length === 0) {
      return { success: false, error: 'Método de pagamento não selecionado' };
    }

    for (const item of summary.items) {
      const cd = this.stockService.getByIdSync(item.cdId);
      if (!cd || cd.estoque < item.quantidade) {
        return { success: false, error: `Produto "${item.titulo}" sem estoque suficiente` };
      }
    }

    try {

      const paymentResult = await this.paymentService.processPayment(summary.paymentMethods);
      
      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error };
      }

      let finalDiscount = summary.discount;
      let finalTotal = summary.total;
      const couponsForOrder = [...this.appliedCoupons];

      if (this.localCheckoutCoupon) {
        const subtotal = summary.subtotal;
        const localDiscount = this.couponService.calculateDiscount(this.localCheckoutCoupon, subtotal);
        finalDiscount = summary.discount + localDiscount;
        finalTotal = subtotal - finalDiscount + summary.shipping;
        
        couponsForOrder.push(this.localCheckoutCoupon);
        
        this.couponService.useCoupon(this.localCheckoutCoupon.code);
        
        console.log(`[SalesService] Cupom local ${this.localCheckoutCoupon.code} aplicado: R$ ${localDiscount.toFixed(2)}`);
      }

      const finalSummary: CartSummary = {
        ...summary,
        discount: finalDiscount,
        total: finalTotal,
        coupons: couponsForOrder
      };

      const order = this.createOrder(finalSummary, paymentResult.transactionId!);

      this.stockService.decrease(
        summary.items.map(item => ({
          cdId: item.cdId,
          quantidade: item.quantidade
        }))
      );

      for (const coupon of couponsForOrder) {
        if (coupon.code.toUpperCase().startsWith('TROCA')) {
          this.couponService.useCoupon(coupon.code);
        } else if (coupon.code.toUpperCase() === 'CUPOMTROCA') {
          this.couponService.useCoupon(coupon.code);
          this.couponService.markExchangeCouponAsUsed();
        } else {
          this.couponService.useCoupon(coupon.code);
        }
      }

      this.clearCart();
      
      this.couponService.clearCurrentOrderCoupons();

      return { success: true, order };
    } catch (error) {
      return { success: false, error: 'Erro interno do sistema' };
    }
  }

  private createOrder(summary: CartSummary, transactionId: string): Order {
    const orderItems: OrderItem[] = summary.items.map(item => ({
      cdId: item.cdId,
      titulo: item.titulo,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      subtotal: item.valorUnitario * item.quantidade
    }));

    const order: Order = {
      id: this.generateOrderId(),
      clientId: summary.clientId!,
      clientName: 'Cliente',
      items: orderItems,
      subtotal: summary.subtotal,
      discount: summary.discount,
      shipping: summary.shipping,
      total: summary.total,
      coupons: summary.coupons,
      paymentMethods: summary.paymentMethods,
      deliveryAddress: summary.deliveryAddress!,
      status: 'OPEN',
      paymentStatus: 'APPROVED',
      createdAt: new Date(),
      orderNumber: this.generateOrderNumber(),
      trackingCode: this.generateTrackingCode(),
      history: [{
        id: 1,
        orderId: 0,
        status: 'OPEN',
        paymentStatus: 'APPROVED',
        timestamp: new Date(),
        userId: 'system',
        notes: 'Pedido criado'
      }]
    };

    order.history![0].orderId = order.id;

    const orders = this.ordersSubject.value;
    orders.push(order);
    this.ordersSubject.next([...orders]);
    this.saveOrders();

    return order;
  }

  getAllOrders(): Order[] {
    return this.ordersSubject.value;
  }

  getOrdersByClient(clientId: number): Order[] {
    return this.ordersSubject.value.filter(order => order.clientId === clientId);
  }

  getOrderById(orderId: number): Order | undefined {
    return this.ordersSubject.value.find(order => order.id === orderId);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.ordersSubject.value.find(order => order.orderNumber === orderNumber);
  }

  updateOrderStatus(orderId: number, status: OrderStatus, notes?: string): boolean {
    const order = this.getOrderById(orderId);
    if (!order) return false;

    const historyEntry = {
      id: order.history!.length + 1,
      orderId: order.id,
      status,
      paymentStatus: order.paymentStatus,
      timestamp: new Date(),
      userId: 'system',
      notes
    };

    order.status = status;
    order.history!.push(historyEntry);
    order.updatedAt = new Date();

    const orders = this.ordersSubject.value;
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index] = order;
      this.ordersSubject.next([...orders]);
      this.saveOrders();
      return true;
    }

    return false;
  }

  private generateOrderId(): number {
    const orders = this.ordersSubject.value;
    const maxId = orders.reduce((max, order) => Math.max(max, order.id), 0);
    return maxId + 1;
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PED${timestamp.slice(-6)}${random}`;
  }

  private generateTrackingCode(): string {
    const random = Math.random().toString(36).substr(2, 10).toUpperCase();
    return `TRK${random}`;
  }
}

