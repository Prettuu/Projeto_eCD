import { Component, OnInit } from '@angular/core';
import { AuthService, UserRole } from '../../core/auth.service';
import { AnalysisService } from '../analysis/analysis.service';
import { OrderService, Order } from '../order/order.service';
import { Client } from '../clients/clients.service';
import { RecommendationsService, Recommendation } from '../recommendations/recommendations.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  userName: string | null = null;
  userRole: UserRole | null = null;

  vendasOntem: number = 0;
  loadingVendas = false;

  clientRanking: Client['ranking'] | null = null;
  loadingRanking = false;

  recommendations: Recommendation[] = [];
  loadingRecommendations = false;

  constructor(
    private auth: AuthService,
    private analysisService: AnalysisService,
    private orderService: OrderService,
    private recommendationsService: RecommendationsService
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getNome();
    this.userRole = this.auth.getRole();

    if (this.userRole === 'ADMIN') {
      this.loadVendasOntem();
    } else if (this.userRole === 'CLIENT') {
      this.loadClientRanking();
      this.loadRecommendations();
    }
  }

  /**
   * RN0027 - Carrega o ranking do cliente logado
   */
  private loadClientRanking(): void {
    this.loadingRanking = true;
    const clientId = this.auth.getClientId() || this.auth.getUserId();
    
    if (!clientId) {
      this.loadingRanking = false;
      return;
    }

    this.orderService.getAll().subscribe({
      next: (orders: Order[]) => {
        const clientOrders = orders.filter(order => order.clientId === clientId);
        this.clientRanking = this.calculateClientRanking(clientOrders);
        this.loadingRanking = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ranking:', err);
        this.loadingRanking = false;
      }
    });
  }

  /**
   * RN0027 - Calcula pontos e nível do ranking
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
    } else if (pontos >= 100) {
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

  /**
   * RN0027 - Retorna a classe CSS do badge
   */
  getRankingBadgeClass(nivel?: string): string {
    if (!nivel) return 'ranking-badge ranking-bronze';
    return `ranking-badge ranking-${nivel.toLowerCase()}`;
  }

  private loadVendasOntem(): void {
    this.loadingVendas = true;
    
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0);
    
    const startDate = this.formatDate(ontem);
    const endDate = this.formatDate(ontem);

    this.analysisService.getSalesSummary(startDate, endDate).subscribe({
      next: (data) => {
        this.vendasOntem = data.summary?.totalRevenue || 0;
        this.loadingVendas = false;
      },
      error: (err) => {
        console.error('Erro ao carregar vendas de ontem:', err);
        this.vendasOntem = 0;
        this.loadingVendas = false;
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private loadRecommendations(): void {
    const clientId = this.auth.getClientId() || this.auth.getUserId();
    if (!clientId) return;

    this.loadingRecommendations = true;
    this.recommendationsService.getPersonalized(clientId, 6).subscribe({
      next: (data) => {
        this.recommendations = data.recommendations;
        this.loadingRecommendations = false;
      },
      error: (err) => {
        console.error('Erro ao carregar recomendações:', err);
        this.loadingRecommendations = false;
      }
    });
  }
}
