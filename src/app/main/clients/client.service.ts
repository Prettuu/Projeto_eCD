import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Client {
  id?: number;
  genero?: string;
  nome: string;
  dataNascimento?: string;
  cpf: string;
  email: string;
  senha?: string;
  ativo: boolean;
  telefone?: any;
  enderecoResidencial?: any;
  enderecosEntrega?: any[];
  cartoes?: any[];
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private apiUrl = 'http://localhost:3000/api/clients';
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  public clients$ = this.clientsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refresh();
  }

  refresh(): void {
    this.http.get<Client[]>(this.apiUrl).subscribe((clients) => {
      this.clientsSubject.next(clients);
    });
  }

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  create(data: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data).pipe(tap(() => this.refresh()));
  }

  update(id: number, data: Client): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data).pipe(tap(() => this.refresh()));
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(tap(() => this.refresh()));
  }

  pesquisar(filtro: string): Client[] {
    const list = this.clientsSubject.value;
    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        c.email.toLowerCase().includes(filtro.toLowerCase()) ||
        c.cpf.includes(filtro)
    );
  }
}
