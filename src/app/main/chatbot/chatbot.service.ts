import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  message: string;
  response: string;
  timestamp: string;
  isUser: boolean;
}

export interface ChatbotResponse {
  response: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:3000/api/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, clientId?: number): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.apiUrl}/chat`, {
      message,
      clientId
    });
  }

  searchProducts(query: string): Observable<{ products: any[]; total: number }> {
    const params = new HttpParams().set('query', query);
    return this.http.get<{ products: any[]; total: number }>(`${this.apiUrl}/search`, { params });
  }
}

