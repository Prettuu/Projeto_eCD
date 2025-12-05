import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService, Client } from './clients.service';
import { AuthService } from '../../core/auth.service';
import { OrderService, Order } from '../order/order.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  clientesFiltrados: Client[] = [];
  filtro = '';
  isProfileMode = false;
  currentUserId: number | null = null;
  loadingRanking = false;

  constructor(
    private clientsService: ClientService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.isProfileMode = (this.route.snapshot.data['profileMode']
      || this.route.parent?.snapshot.data['profileMode']) || false;

    if (this.isProfileMode) {

      this.loadCurrentUserProfile();
    } else {

      this.clientsService.clients$.subscribe(list => {
        this.clients = list || [];
        this.clientesFiltrados = [...this.clients];
        if (this.filtro) {
          this.pesquisar();
        }
        this.calculateRanking();
      });
    }
  }

  private calculateRanking(): void {
    if (this.isProfileMode) return;
    
    this.loadingRanking = true;
    
    this.orderService.getAll().subscribe({
      next: (orders: Order[]) => {
        this.clients.forEach(client => {
          if (client.id) {
            const clientOrders = orders.filter(order => order.clientId === client.id);
            client.ranking = this.calculateClientRanking(clientOrders);
          }
        });
        
        this.clientesFiltrados = this.clients.map(c => ({ ...c }));
        this.loadingRanking = false;
      },
      error: (err) => {
        console.error('Erro ao calcular ranking:', err);
        this.loadingRanking = false;
      }
    });
  }

  /**
   * RN0027 - Calcula pontos e nível do ranking para um cliente
   * Fórmula: pontos = (quantidadeCompras × 10) + (valorTotalGasto ÷ 10) + (frequencia × 5)
   */
  private calculateClientRanking(orders: Order[]): Client['ranking'] {
    const validOrders = orders.filter(order => 
      order.status !== 'CANCELADO' && 
      order.status !== 'REPROVADA' &&
      order.status !== 'DEVOLVIDO'
    );

    const quantidadeCompras = validOrders.length;
    const valorTotalGasto = validOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
    const frequencia = validOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= trintaDiasAtras;
    }).length;

    const pontos = (quantidadeCompras * 10) + (valorTotalGasto / 10) + (frequencia * 5);

    let nivel: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
    if (pontos >= 1001) {
      nivel = 'DIAMANTE';
    } else if (pontos >= 501) {
      nivel = 'OURO';
    } else if (pontos >= 201) {
      nivel = 'PRATA';
    } else {
      nivel = 'BRONZE';
    }

    return {
      pontos: Math.round(pontos),
      nivel,
      quantidadeCompras,
      valorTotalGasto,
      frequencia
    };
  }

  /**
   * RN0027 - Retorna a classe CSS do badge baseado no nível
   */
  getRankingBadgeClass(nivel?: string): string {
    if (!nivel) return 'ranking-badge ranking-bronze';
    return `ranking-badge ranking-${nivel.toLowerCase()}`;
  }

  /**
   * RN0027 - Retorna o emoji do nível
   */
  getRankingEmoji(nivel?: string): string {
    switch (nivel) {
      case 'DIAMANTE': return '💎';
      case 'OURO': return '🥇';
      case 'PRATA': return '🥈';
      case 'BRONZE': return '🥉';
      default: return '🥉';
    }
  }

  private loadCurrentUserProfile(): void {

    let clientId = this.auth.getClientId();

    if (!clientId) {
      clientId = this.auth.getUserId();
    }
    
    if (!clientId) {
      console.warn('No clientId or userId found in auth service');
      this.clients = [];
      this.clientesFiltrados = [];
      return;
    }
    
    console.log('Loading profile for client ID:', clientId);

    this.clientsService.getById(clientId).subscribe({
      next: (client) => {
        if (client) {
          this.clients = [client];
          this.clientesFiltrados = [client];
          this.currentUserId = client.id || null;
          console.log('Profile loaded successfully:', client);
        } else {
          console.warn('No client found with ID:', clientId);
          this.clients = [];
          this.clientesFiltrados = [];
        }
      },
      error: (err) => {
        console.error('Error loading client profile:', err);
        this.clients = [];
        this.clientesFiltrados = [];
      }
    });
  }

  reload(): void {
    this.clientsService.refresh();
  }

  create(): void {
    this.router.navigate(['/app/clients/create']);
  }

  edit(id: number): void {
    if (this.isProfileMode) {
      this.router.navigate(['edit', id], { relativeTo: this.route });
    } else {
    this.router.navigate(['/app/clients/edit', id]);
    }
  }

  delete(id: number): void {
    if (!id) return;
    if (confirm('Excluir este cliente?')) {
      this.clientsService.delete(id).subscribe({
        next: () => {
          this.clientsService.refresh();
        },
        error: (err) => {
          console.error('Erro ao excluir:', err);
          alert('Erro ao excluir cliente. Tente novamente.');
        }
      });
    }
  }

  pesquisar(): void {
    this.clientesFiltrados = this.clientsService.pesquisar(this.filtro);
    this.clientesFiltrados.forEach(clientFiltrado => {
      const clientOriginal = this.clients.find(c => c.id === clientFiltrado.id);
      if (clientOriginal?.ranking) {
        clientFiltrado.ranking = clientOriginal.ranking;
      }
    });
  }
}
