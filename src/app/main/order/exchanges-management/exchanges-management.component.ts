import { Component, OnInit } from '@angular/core';
import { ExchangeService } from '../../sales/exchange.service';
import { ReturnService } from '../../sales/return.service';
import { Exchange } from '../../../shared/model/sales/exchange';
import { Return } from '../../../shared/model/sales/return';
import { CouponService } from '../../sales/coupon.service';

@Component({
  selector: 'app-exchanges-management',
  templateUrl: './exchanges-management.component.html',
  styleUrls: ['./exchanges-management.component.scss']
})
export class ExchangesManagementComponent implements OnInit {
  exchanges: Exchange[] = [];
  returns: Return[] = [];
  activeTab: 'exchanges' | 'returns' = 'exchanges';
  selectedExchange?: Exchange;
  selectedReturn?: Return;
  isLoading = false;
  approvalObservations = '';

  constructor(
    private exchangeService: ExchangeService,
    private returnService: ReturnService,
    private couponService: CouponService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.exchangeService.getAll().subscribe({
      next: (exchanges) => {
        this.exchanges = exchanges;
        this.isLoading = false;
        if (this.selectedExchange) {
          const updated = exchanges.find(e => e.id === this.selectedExchange!.id);
          if (updated) {
            this.selectedExchange = updated;
          }
        }
      },
      error: (err) => {
        console.error('Erro ao carregar trocas:', err);
        this.isLoading = false;
      }
    });

    this.returnService.getAll().subscribe({
      next: (returns) => {
        this.returns = returns;
      },
      error: (err) => {
        console.error('Erro ao carregar devoluções:', err);
      }
    });
  }

  setActiveTab(tab: 'exchanges' | 'returns'): void {
    this.activeTab = tab;
    this.selectedExchange = undefined;
    this.selectedReturn = undefined;
    this.approvalObservations = '';
  }

  viewDetails(exchange: Exchange): void {
    this.selectedExchange = exchange;
    this.selectedReturn = undefined;
  }

  viewReturnDetails(returnRequest: Return): void {
    this.selectedReturn = returnRequest;
    this.selectedExchange = undefined;
  }

  approveExchange(id: number): void {
    if (!confirm('Deseja aprovar esta solicitação de troca? A troca entrará em andamento e aguardará o retorno do produto.')) {
      return;
    }

    this.isLoading = true;
    this.exchangeService.approve(id, this.approvalObservations).subscribe({
      next: (exchange) => {
        alert('Troca aprovada! Status alterado para TROCA EM ANDAMENTO. Aguarde o retorno do produto para gerar o cupom.');
        this.loadData();
        this.exchangeService.getById(id).subscribe(updatedExchange => {
          this.selectedExchange = updatedExchange;
        });
        this.approvalObservations = '';
      },
      error: (err) => {
        console.error('Erro ao aprovar troca:', err);
        alert('Erro ao aprovar troca. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  confirmExchangeReceived(id: number): void {
    if (!confirm('Deseja confirmar o recebimento dos produtos devolvidos? O cupom CUPOMTROCA ficará disponível para uso.')) {
      return;
    }

    this.isLoading = true;
    this.exchangeService.confirmReceived(id).subscribe({
      next: (exchange) => {
        const generatedCoupon = (exchange as any).generatedCoupon;
        const orderTotal = (exchange as any).orderTotal || 0;
        
        if (generatedCoupon && generatedCoupon.code) {
          alert(`Recebimento confirmado com sucesso!\n\n🎫 Cupom de Troca Gerado:\n\nCódigo: ${generatedCoupon.code}\nValor: R$ ${generatedCoupon.value.toFixed(2)}\n\nEste cupom pode ser usado em uma única compra.`);
        } else if (orderTotal > 0) {
          this.couponService.resetExchangeCouponStatus();
          this.couponService.setExchangeCouponValue(orderTotal);
          alert(`Recebimento confirmado com sucesso!\n\n🎫 Cupom de Troca Disponível: CUPOMTROCA\n\nValor: R$ ${orderTotal.toFixed(2)}\n\nEste cupom pode ser usado em uma única compra.`);
        } else {
          alert('Recebimento confirmado com sucesso!\n\nO cupom será gerado em breve.');
        }
        
        this.loadData();
        this.exchangeService.getById(id).subscribe(updatedExchange => {
          this.selectedExchange = updatedExchange;
        });
      },
      error: (err) => {
        console.error('Erro ao confirmar recebimento:', err);
        const errorMessage = err?.error?.message || 'Erro ao confirmar recebimento. Tente novamente.';
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  rejectExchange(id: number): void {
    if (!confirm('Deseja negar esta solicitação de troca?')) {
      return;
    }

    this.isLoading = true;
    this.exchangeService.reject(id, this.approvalObservations).subscribe({
      next: () => {
        alert('Troca negada com sucesso');
        this.loadData();
        this.selectedExchange = undefined;
        this.approvalObservations = '';
      },
      error: (err) => {
        console.error('Erro ao negar troca:', err);
        alert('Erro ao negar troca. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  approveReturn(id: number): void {
    if (!confirm('Deseja aprovar esta solicitação de devolução?')) {
      return;
    }

    this.isLoading = true;
    this.returnService.approve(id, this.approvalObservations).subscribe({
      next: () => {
        alert('Devolução aprovada com sucesso');
        this.loadData();
        this.selectedReturn = undefined;
        this.approvalObservations = '';
      },
      error: (err) => {
        console.error('Erro ao aprovar devolução:', err);
        alert('Erro ao aprovar devolução. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  rejectReturn(id: number): void {
    if (!confirm('Deseja negar esta solicitação de devolução?')) {
      return;
    }

    this.isLoading = true;
    this.returnService.reject(id, this.approvalObservations).subscribe({
      next: () => {
        alert('Devolução negada com sucesso');
        this.loadData();
        this.selectedReturn = undefined;
        this.approvalObservations = '';
      },
      error: (err) => {
        console.error('Erro ao negar devolução:', err);
        alert('Erro ao negar devolução. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  confirmReceived(id: number): void {
    if (!confirm('Deseja confirmar o recebimento dos produtos devolvidos?')) {
      return;
    }

    this.isLoading = true;
    this.returnService.confirmReceived(id).subscribe({
      next: () => {
        alert('Recebimento confirmado! O estoque foi atualizado.');
        this.loadData();
        this.selectedReturn = undefined;
      },
      error: (err) => {
        console.error('Erro ao confirmar recebimento:', err);
        alert('Erro ao confirmar recebimento. Tente novamente.');
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'PENDENTE': 'status-pending',
      'APROVADA': 'status-approved',
      'NEGADA': 'status-rejected',
      'TROCA EM ANDAMENTO': 'status-in-progress',
      'PROCESSANDO': 'status-processing',
      'RECEBIDA': 'status-received',
      'CONCLUIDA': 'status-completed',
      'CANCELADA': 'status-cancelled'
    };
    return statusMap[status] || '';
  }

  isPendingStatus(status: string | undefined): boolean {
    if (!status) return false;
    return status.toUpperCase() === 'PENDENTE';
  }

  isInProgressStatus(status: string | undefined): boolean {
    if (!status) return false;
    return status.toUpperCase() === 'TROCA EM ANDAMENTO';
  }

  isExchangeCouponAvailable(): boolean {
    return this.couponService.isExchangeCouponAvailable();
  }

  getExchangeCouponValue(): number {
    try {
      const storedValue = localStorage.getItem('exchange_coupon_value');
      return storedValue ? parseFloat(storedValue) : 0;
    } catch {
      return 0;
    }
  }

  getExchangeCouponValueForExchange(exchange: Exchange): number {
    try {
      if (exchange.generatedCoupon && exchange.generatedCoupon.value) {
        return exchange.generatedCoupon.value;
      }
      
      const storedValue = localStorage.getItem('exchange_coupon_value');
      if (storedValue) {
        const value = parseFloat(storedValue);
        if (value > 0) {
          return value;
        }
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  getExchangeCouponCode(exchange?: Exchange): string {
    if (exchange?.generatedCoupon?.code) {
      return exchange.generatedCoupon.code;
    }
    
    if (exchange?.couponGenerated) {
      return exchange.couponGenerated;
    }
    
    return 'CUPOMTROCA';
  }

  isExchangeCouponUsed(exchange?: Exchange): boolean {
    if (exchange?.generatedCoupon) {
      return exchange.generatedCoupon.used;
    }
    
    try {
      const stored = localStorage.getItem('used_exchange_coupons');
      const used = stored ? JSON.parse(stored) : [];
      return used.includes('CUPOMTROCA');
    } catch {
      return false;
    }
  }
}

