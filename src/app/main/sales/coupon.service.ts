import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Coupon } from '../../shared/model/sales/sales';
import { ExchangeService } from './exchange.service';
import { ExchangeCouponService } from './exchange-coupon.service';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private couponsSubject = new BehaviorSubject<Coupon[]>([]);
  public coupons$ = this.couponsSubject.asObservable();

  constructor(
    private exchangeService: ExchangeService,
    private exchangeCouponService: ExchangeCouponService
  ) {
    this.initializeCoupons();
  }

  private initializeCoupons(): void {

    const defaultCoupons: Coupon[] = [
      {
        id: 'PROMO10',
        code: 'PROMO10',
        type: 'PERCENTAGE',
        value: 10,
        minValue: 50,
        maxDiscount: 20,
        validUntil: new Date('2024-12-31'),
        usedCount: 0,
        maxUses: 1000,
        isActive: true
      },
      {
        id: 'DESC20',
        code: 'DESC20',
        type: 'PERCENTAGE',
        value: 20,
        minValue: 100,
        maxDiscount: 50,
        validUntil: new Date('2024-12-31'),
        usedCount: 0,
        maxUses: 500,
        isActive: true
      },
      {
        id: 'FIXED15',
        code: 'FIXED15',
        type: 'FIXED',
        value: 15,
        minValue: 30,
        validUntil: new Date('2024-12-31'),
        usedCount: 0,
        maxUses: 200,
        isActive: true
      },
      {
        id: 'CUPOMTROCA',
        code: 'CUPOMTROCA',
        type: 'EXCHANGE',
        value: 0,
        validUntil: new Date('2099-12-31'),
        usedCount: 0,
        maxUses: 1,
        isActive: true
      },
      {
        id: 'COMPRA1',
        code: 'COMPRA1',
        type: 'PERCENTAGE',
        value: 30,
        minValue: 0,
        validUntil: new Date('2099-12-31'),
        usedCount: 0,
        maxUses: 1000,
        isActive: true
      },
      {
        id: '30FF',
        code: '30FF',
        type: 'FIXED',
        value: 30,
        minValue: 0,
        validUntil: new Date('2099-12-31'),
        usedCount: 0,
        maxUses: 1000,
        isActive: true
      }
    ];

    this.couponsSubject.next(defaultCoupons);
  }

  getAllCoupons(): Coupon[] {
    return this.couponsSubject.value;
  }

  getActiveCoupons(): Coupon[] {
    return this.couponsSubject.value.filter(c => c.isActive);
  }

  getCouponByCode(code: string): Coupon | undefined {
    return this.couponsSubject.value.find(c => 
      c.code.toUpperCase() === code.toUpperCase() && c.isActive
    );
  }

  validateCoupon(code: string, cartValue: number, clientId?: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const coupon = this.getCouponByCode(code);
    
    if (!coupon) {
      if (code.toUpperCase().startsWith('TROCA')) {
        return { valid: false, error: 'Cupom não encontrado. Verifique o código.' };
      }
      return { valid: false, error: 'Cupom não encontrado' };
    }

    if (code.toUpperCase() === 'CUPOMTROCA') {
      const usedCoupons = this.getUsedExchangeCoupons();
      if (usedCoupons.includes('CUPOMTROCA')) {
        return { valid: false, error: 'Cupom de troca já foi utilizado' };
      }
      
      const exchangeCouponAvailable = this.isExchangeCouponAvailable();
      if (!exchangeCouponAvailable) {
        return { valid: false, error: 'Cupom de troca não está disponível. Faça uma troca primeiro.' };
      }
      
      return { valid: true, coupon };
    }

    if (code.toUpperCase().startsWith('TROCA')) {
      const exchangeCoupon: Coupon = {
        id: code,
        code: code.toUpperCase(),
        type: 'EXCHANGE',
        value: 0,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usedCount: 0,
        maxUses: 1,
        isActive: true
      };
      return { valid: true, coupon: exchangeCoupon };
    }

    if (code.toUpperCase() !== 'COMPRA1' && coupon.validUntil && coupon.validUntil < new Date()) {
      return { valid: false, error: 'Cupom expirado' };
    }

    if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'Cupom esgotado' };
    }

    if (coupon.minValue && cartValue < coupon.minValue) {
      return { valid: false, error: `Valor mínimo do carrinho: R$ ${coupon.minValue}` };
    }

    return { valid: true, coupon };
  }

  private getUsedExchangeCoupons(): string[] {
    try {
      const stored = localStorage.getItem('used_exchange_coupons');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  isExchangeCouponAvailable(): boolean {
    try {
      const stored = localStorage.getItem('exchange_coupon_available');
      return stored === 'true';
    } catch {
      return false;
    }
  }

  setExchangeCouponAvailable(available: boolean): void {
    try {
      const value = available ? 'true' : 'false';
      localStorage.setItem('exchange_coupon_available', value);
    } catch (error) {
    }
  }

  setExchangeCouponValue(value: number): void {
    if (value && value > 0) {
      localStorage.setItem('exchange_coupon_value', value.toString());
    }
  }

  markExchangeCouponAsUsed(): void {
    const used = this.getUsedExchangeCoupons();
    if (!used.includes('CUPOMTROCA')) {
      used.push('CUPOMTROCA');
      localStorage.setItem('used_exchange_coupons', JSON.stringify(used));
      this.setExchangeCouponAvailable(false);
    }
  }

  resetExchangeCouponStatus(): void {
    try {
      const used = this.getUsedExchangeCoupons();
      const index = used.indexOf('CUPOMTROCA');
      if (index > -1) {
        used.splice(index, 1);
        localStorage.setItem('used_exchange_coupons', JSON.stringify(used));
      }
      
      this.setExchangeCouponAvailable(true);
    } catch (error) {
      this.setExchangeCouponAvailable(true);
    }
  }

  calculateDiscount(coupon: Coupon, cartValue: number): number {
    let discount = 0;

    if (coupon.type === 'FINAL_CHECKOUT' || coupon.isLocal) {
      if (coupon.code.toUpperCase() === 'COMPRA1') {
        discount = cartValue * (coupon.value / 100);
        console.log(`[CouponService] Desconto calculado para cupom local ${coupon.code}: R$ ${discount.toFixed(2)} (${coupon.value}% de R$ ${cartValue.toFixed(2)})`);
        return Math.min(discount, cartValue);
      }
      if (coupon.value > 0 && coupon.value <= 100) {
        discount = cartValue * (coupon.value / 100);
      } else {
        discount = coupon.value;
      }
      return Math.min(discount, cartValue);
    }

    if (coupon.code.toUpperCase().startsWith('TROCA')) {
      discount = Number(coupon.value) || 0;
      return Math.min(discount, cartValue);
    }

    switch (coupon.type) {
      case 'PERCENTAGE':
        discount = cartValue * (coupon.value / 100);
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
        break;
      case 'FIXED':
        discount = coupon.value;
        break;
      case 'EXCHANGE':
        if (coupon.code.toUpperCase() === 'CUPOMTROCA') {
          try {
            const storedValue = localStorage.getItem('exchange_coupon_value');
            discount = storedValue ? parseFloat(storedValue) : 0;
          } catch (error) {
            discount = 0;
          }
        } else {
          discount = coupon.value;
        }
        break;
    }

    return Math.min(discount, cartValue);
  }


  useCoupon(code: string): boolean {
    const coupon = this.getCouponByCode(code);
    if (!coupon) return false;

    if (code.toUpperCase() === 'COMPRA1') {
      this.markCouponAsUsedInCurrentOrder('COMPRA1');
    }

    const coupons = this.couponsSubject.value;
    const index = coupons.findIndex(c => c.id === coupon.id);
    
    if (index !== -1) {
      coupons[index].usedCount = (coupons[index].usedCount || 0) + 1;
      this.couponsSubject.next([...coupons]);
      return true;
    }

    return false;
  }

  isCouponUsedInCurrentOrder(code: string): boolean {
    try {
      const stored = sessionStorage.getItem('coupons_used_in_current_order');
      const used = stored ? JSON.parse(stored) : [];
      return used.includes(code.toUpperCase());
    } catch {
      return false;
    }
  }

  private markCouponAsUsedInCurrentOrder(code: string): void {
    try {
      const stored = sessionStorage.getItem('coupons_used_in_current_order');
      const used = stored ? JSON.parse(stored) : [];
      if (!used.includes(code.toUpperCase())) {
        used.push(code.toUpperCase());
        sessionStorage.setItem('coupons_used_in_current_order', JSON.stringify(used));
      }
    } catch (error) {
      console.error('[CouponService] Erro ao marcar cupom como usado no pedido:', error);
    }
  }

  clearCurrentOrderCoupons(): void {
    try {
      sessionStorage.removeItem('coupons_used_in_current_order');
    } catch (error) {
      console.error('[CouponService] Erro ao limpar cupons do pedido:', error);
    }
  }

  createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount'>): Coupon {
    const newCoupon: Coupon = {
      ...coupon,
      id: this.generateCouponId(),
      usedCount: 0
    };

    const coupons = this.couponsSubject.value;
    coupons.push(newCoupon);
    this.couponsSubject.next([...coupons]);

    return newCoupon;
  }

  private generateCouponId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}${random}`.toUpperCase();
  }

  generateExchangeCoupon(orderId: number, value: number): Coupon {
    const exchangeCoupon: Coupon = {
      id: `TROCA${orderId}`,
      code: `TROCA${orderId}`,
      type: 'EXCHANGE',
      value: value,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedCount: 0,
      maxUses: 1,
      isActive: true
    };

    const coupons = this.couponsSubject.value;
    coupons.push(exchangeCoupon);
    this.couponsSubject.next([...coupons]);

    return exchangeCoupon;
  }
}

