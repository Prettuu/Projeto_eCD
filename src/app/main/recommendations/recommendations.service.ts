import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cd } from '../stock/stock.service';

export interface Recommendation extends Cd {
  score: number;
  reasons: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationsService {
  private apiUrl = 'http://localhost:3000/api/recommendations';

  constructor(private http: HttpClient) {}

  getPersonalized(clientId: number, limit: number = 10): Observable<{ recommendations: Recommendation[]; total: number }> {
    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ recommendations: Recommendation[]; total: number }>(this.apiUrl, { params });
  }
}

