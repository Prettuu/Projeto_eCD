import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feedback {
  id?: number;
  clientId: number;
  productId: number;
  liked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/api/feedback';

  constructor(private http: HttpClient) {}

  create(feedback: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'>): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedback);
  }

  getByClient(clientId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/client/${clientId}`);
  }
}

