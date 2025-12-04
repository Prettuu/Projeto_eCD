import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { CouponService } from '../sales/coupon.service';
import { ExchangeCouponService } from '../sales/exchange-coupon.service';

export interface CartItem {
  cdId: number;
  titulo: string;
  valorUnitario: number;
  quantidade: number;
  clientId?: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = 'http://localhost:3000/api/cart';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  private selectedClientIdSubject = new BehaviorSubject<number | null>(null);
  selectedClientId$ = this.selectedClientIdSubject.asObservable();

  private currentCoupon: string | null = null;
  private currentDiscount: number = 0;
  private appliedCoupons: Array<{ code: string; value: number; type: string }> = [];

  constructor(
    private http: HttpClient,
    private couponService: CouponService,
    private exchangeCouponService: ExchangeCouponService
  ) {}

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get selectedClientId(): number | null {
    return this.selectedClientIdSubject.value;
  }

  setClient(id: number | null) {
    const previousClientId = this.selectedClientId;
    this.selectedClientIdSubject.next(id);
    
    if (previousClientId !== null && previousClientId !== id) {
      this.clearCoupons();
    }
    
    if (id) {
      const updated = this.items.map(i =>
        i.clientId ? i : { ...i, clientId: id }
      );
      this.itemsSubject.next(updated);
    } else {
      this.clearCoupons();
    }
  }

  get() {
    const clientId = this.selectedClientId;
    const items = clientId
      ? this.items.filter((i) => i.clientId === clientId)
      : [];

    const subtotal = items.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0);
    const desconto = this.calculateTotalDiscount(subtotal);
    this.currentDiscount = desconto;
    const frete = 0;
    const cupom = this.currentCoupon;

    const totalComDesconto = subtotal - desconto + frete;

    return {
      clientId,
      items,
      subtotal,
      desconto,
      frete,
      cupom,
      totalComDesconto
    };
  }

  addItem(item: {
    cdId: number;
    titulo: string;
    valorUnitario: number;
    quantidade: number;
    clientId?: number;
  }) {
    const clientId = item.clientId ?? this.selectedClientId;
    if (!clientId) return;

    const newItem: CartItem = { ...item, clientId };
    const list = [...this.items];
    const idx = list.findIndex(
      (i) => i.cdId === newItem.cdId && i.clientId === clientId
    );
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        quantidade: list[idx].quantidade + newItem.quantidade,
      };
    } else {
      list.push(newItem);
    }
    this.itemsSubject.next(list);
  }

  updateQty(cdId: number, qty: number, clientId?: number | null) {
    const cid = clientId ?? this.selectedClientId;
    const list = this.items.map((i) =>
      i.cdId === cdId && i.clientId === cid ? { ...i, quantidade: qty } : i
    );
    this.itemsSubject.next(list);
  }

  remove(cdId: number, clientId?: number | null) {
    const cid = clientId ?? this.selectedClientId;
    this.itemsSubject.next(
      this.items.filter((i) => !(i.cdId === cdId && i.clientId === cid))
    );
  }

  clearForClient(clientId?: number | null) {
    const cid = clientId ?? this.selectedClientId;
    this.itemsSubject.next(this.items.filter((i) => i.clientId !== cid));
    this.currentCoupon = null;
    this.currentDiscount = 0;
    this.appliedCoupons = [];
  }

  clearAll() {
    this.itemsSubject.next([]);
    this.currentCoupon = null;
    this.currentDiscount = 0;
    this.appliedCoupons = [];
  }

  clearCoupons(): void {
    this.currentCoupon = null;
    this.currentDiscount = 0;
    this.appliedCoupons = [];
  }

  applyCoupon(code: string): Observable<{ success: boolean; error?: string }> {
    const currentState = this.get();
    const subtotal = currentState.subtotal;
    const clientId = currentState.clientId;

    if (!code || !code.trim()) {
      return of({ success: false, error: 'Código do cupom não informado' });
    }

    const codeUpper = code.toUpperCase().trim();

    if (this.appliedCoupons.find(c => c.code.toUpperCase() === codeUpper)) {
      return of({ success: false, error: 'Cupom já aplicado' });
    }

    if (codeUpper.startsWith('TROCA')) {
      if (!clientId) {
        return of({ success: false, error: 'Cliente não selecionado' });
      }

      return this.exchangeCouponService.validateCoupon(codeUpper, clientId).pipe(
        map(validation => {
          if (!validation || !validation.valid) {
            return { success: false, error: validation?.error || 'Cupom inválido' };
          }

          if (!validation.coupon) {
            return { success: false, error: 'Cupom não encontrado' };
          }

          const couponValue = Number(validation.coupon.value) || 0;
          
          if (couponValue === 0) {
            return { success: false, error: 'Cupom inválido: valor zerado' };
          }
          
          this.appliedCoupons.push({
            code: codeUpper,
            value: couponValue,
            type: 'EXCHANGE'
          });

          this.currentCoupon = codeUpper;
          const updatedState = this.get();
          this.currentDiscount = updatedState.desconto;

          return { success: true };
        }),
        catchError(error => {
          return of({ success: false, error: error?.error?.message || 'Erro ao validar cupom' });
        })
      );
    }

    const validation = this.couponService.validateCoupon(codeUpper, subtotal, clientId || undefined);

    if (!validation.valid) {
      return of({ success: false, error: validation.error || 'Cupom inválido' });
    }

    if (!validation.coupon) {
      return of({ success: false, error: 'Cupom não encontrado' });
    }

    this.appliedCoupons.push({
      code: codeUpper,
      value: validation.coupon.value || 0,
      type: validation.coupon.type
    });

    this.currentCoupon = codeUpper;
    const finalState = this.get();
    this.currentDiscount = finalState.desconto;

    return of({ success: true });
  }

  private calculateTotalDiscount(subtotal: number): number {
    let totalDiscount = 0;

    for (const appliedCoupon of this.appliedCoupons) {
      if (appliedCoupon.type === 'EXCHANGE') {
        totalDiscount += appliedCoupon.value;
      } else {
        const coupon = this.couponService.getCouponByCode(appliedCoupon.code);
        if (coupon) {
          totalDiscount += this.couponService.calculateDiscount(coupon, subtotal);
        }
      }
    }

    return Math.min(totalDiscount, subtotal);
  }

  removeCoupon(code: string): void {
    const codeUpper = code.toUpperCase();
    this.appliedCoupons = this.appliedCoupons.filter(c => c.code.toUpperCase() !== codeUpper);
    
    const state = this.get();
    this.currentCoupon = this.appliedCoupons.length > 0 ? this.appliedCoupons[0].code : null;
    this.currentDiscount = this.calculateTotalDiscount(state.subtotal);
  }

  getAppliedCoupons(): Array<{ code: string; value: number; type: string }> {
    return [...this.appliedCoupons];
  }

  loadFromDatabase(clientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?clientId=${clientId}`).pipe(
      tap((response) => {
        if (response.items && response.items.length > 0) {
          const items: CartItem[] = response.items.map((item: any) => ({
            cdId: item.cdId || item.productId,
            titulo: item.titulo,
            valorUnitario: item.valorUnitario,
            quantidade: item.quantidade,
            clientId: item.clientId
          }));
          
          const existingItems = this.items.filter(i => i.clientId === clientId);
          const mergedItems = [...existingItems];
          
          items.forEach((newItem) => {
            const existingIndex = mergedItems.findIndex(
              i => i.cdId === newItem.cdId && i.clientId === clientId
            );
            if (existingIndex >= 0) {
              mergedItems[existingIndex] = {
                ...mergedItems[existingIndex],
                quantidade: Math.max(mergedItems[existingIndex].quantidade, newItem.quantidade)
              };
            } else {
              mergedItems.push(newItem);
            }
          });
          
          const otherClientItems = this.items.filter(i => i.clientId !== clientId);
          this.itemsSubject.next([...otherClientItems, ...mergedItems]);
        }
      })
    );
  }
}
