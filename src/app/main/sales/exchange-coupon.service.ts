import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExchangeCoupon } from '../../shared/model/sales/exchange-coupon';

@Injectable({ providedIn: 'root' })
export class ExchangeCouponService {
  private readonly API_URL = 'http://localhost:3000/api/exchange-coupons';

  constructor(private http: HttpClient) {}

  getByClientId(clientId: number, used?: boolean): Observable<ExchangeCoupon[]> {
    let url = `${this.API_URL}/client/${clientId}`;
    if (used !== undefined) {
      url += `?used=${used}`;
    }
    return this.http.get<ExchangeCoupon[]>(url);
  }

  getByCode(code: string): Observable<ExchangeCoupon> {
    return this.http.get<ExchangeCoupon>(`${this.API_URL}/code/${code}`);
  }

  validateCoupon(code: string, clientId?: number): Observable<{ valid: boolean; coupon?: any; error?: string }> {
    return this.http.post<{ valid: boolean; coupon?: any; error?: string }>(`${this.API_URL}/validate`, {
      code,
      clientId
    });
  }

  markAsUsed(code: string): Observable<ExchangeCoupon> {
    return this.http.patch<ExchangeCoupon>(`${this.API_URL}/${code}/use`, {});
  }
}

