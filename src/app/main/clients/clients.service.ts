import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Client {
  id?: number;
  nome: string;
  email: string;
  cpf?: string; // Opcional pois pode não estar preenchido
  ativo?: boolean;
  role?: 'ADMIN' | 'CLIENT'; // Adicionar role para compatibilidade com User
  cartoes?: Cartao[] | any; // Pode vir como JSON string do backend
  telefone?: any;
  enderecoResidencial?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    observacoes?: string;
  } | any;
  enderecosEntrega?: any[];
  genero?: string;
  dataNascimento?: string;
  ranking?: {
    pontos: number;
    nivel: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
    quantidadeCompras: number;
    valorTotalGasto: number;
    frequencia: number;
  };
}

export interface Cartao {
  id?: number;
  numero: string;
  bandeira: string;
  validade?: string;
  titular?: string;
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
    this.http.get<Client[]>(this.apiUrl).pipe(
      map(clients =>
        clients.map(c => this.ensureEnderecoObjeto(c))
      )
    ).subscribe((clients) => {
      this.clientsSubject.next(clients);
    });
  }

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl).pipe(
      map(clients => clients.map(c => this.ensureEnderecoObjeto(c)))
    );
  }

  getById(id: number): Observable<Client | undefined> {

    return this.http.get<Client>(`${this.apiUrl}/${id}`).pipe(
      map(c => {
        const client = this.ensureEnderecoObjeto(c);

        if (client && typeof (client as any).cartoes === 'string') {
          try {
            (client as any).cartoes = JSON.parse((client as any).cartoes);
          } catch {
            console.warn('Erro ao converter cartoes para objeto');
            (client as any).cartoes = [];
          }
        }
        return client;
      }),
      tap(client => {

        const localList = this.clientsSubject.value;
        const index = localList.findIndex(c => c.id === client?.id);
        if (index !== -1 && client) {
          localList[index] = client;
          this.clientsSubject.next([...localList]);
        }
      })
    );
  }

  private ensureEnderecoObjeto(client: Client): Client {
    if (client && typeof (client as any).enderecoResidencial === 'string') {
      try {
        (client as any).enderecoResidencial = JSON.parse((client as any).enderecoResidencial);
      } catch {
        console.warn('Erro ao converter enderecoResidencial para objeto', client.enderecoResidencial);
        (client as any).enderecoResidencial = {};
      }
    }
    return client;
  }

  create(data: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data).pipe(
      tap(() => this.refresh())
    );
  }

  update(id: number, data: Omit<Client, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.refresh())
    );
  }

  pesquisar(filtro: string): Client[] {
    const list = this.clientsSubject.value;
    return list.filter(
      (c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        c.email.toLowerCase().includes(filtro.toLowerCase()) ||
        (c.cpf?.includes(filtro) ?? false)
    );
  }
}
