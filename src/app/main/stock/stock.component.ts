import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Cd, StockService } from './stock.service';
import { CartService } from '../cart/cart.service';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ClientService, Client } from '../clients/clients.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../feedback/feedback.service';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss']
})
export class StockComponent implements OnInit {
  cds: Cd[] = [];
  clientes: Client[] = [];
  selectedClientId: number | null = null;
  iconAdd = faPlus;
  iconEdit = faPenToSquare;
  iconTrash = faTrash;
  isReadonly = false;
  isAdmin = false;

  constructor(
    private stockService: StockService,
    private cart: CartService,
    private router: Router,
    private clientsService: ClientService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {

    this.isReadonly = this.route.snapshot.data['readonly'] || false;

    this.isAdmin = this.auth.getRole() === 'ADMIN';
    
    this.reload();

    if (this.isReadonly && !this.isAdmin) {
      const email = localStorage.getItem('userEmail');
      if (email) {
        this.clientsService.getAll().subscribe(list => {
          const client = (list || []).find(c => c.email === email);
          if (client?.id) {
            this.selectedClientId = client.id;
            this.cart.setClient(client.id);
          }
        });
      }
    } else if (this.isAdmin) {
      this.selectedClientId = null;
      this.clientes = [];
    }
  }
  private reload(): void {
    if (this.isAdmin && !this.isReadonly) {
      this.stockService.getAllAdmin().subscribe({
        next: (cds) => {
          this.cds = cds;
        },
        error: (err) => {
          console.error('Erro ao carregar produtos:', err);
          this.cds = [];
        }
      });
    } else {
      this.stockService.getAll().subscribe({
        next: (cds) => {
          this.cds = cds;
        },
        error: (err) => {
          console.error('Erro ao carregar produtos:', err);
          this.cds = [];
        }
      });
    }
  }

  redirectForm(): void { this.router.navigate(['/app/stock/form']); }
  edit(cd: Cd): void { this.router.navigate(['/app/stock/form', cd.id]); }

  delete(cd: Cd): void {
    if (!cd) return;
    if (confirm(`Excluir "${cd.titulo}"?`)) {
      this.stockService.delete(cd.id);
      this.reload();
    }
  }

  goToCart(): void {
    this.router.navigate(['/app/cart']);
  }

  onClientChange(): void {
    this.cart.setClient(this.selectedClientId);
  }

  addToCart(cd: Cd): void {
    if (!this.selectedClientId) {
      const email = localStorage.getItem('userEmail');
      if (email) {
        this.clientsService.getAll().subscribe(list => {
          const client = (list || []).find(c => c.email === email);
          if (client?.id) {
            this.selectedClientId = client.id;
            this.cart.setClient(client.id);
            this.addToCartWithClient(cd, client.id);
          } else {
            alert('Cliente não encontrado. Faça login novamente.');
          }
        });
      } else {
        alert('Faça login para adicionar produtos ao carrinho.');
      }
      return;
    }
    
    this.addToCartWithClient(cd, this.selectedClientId);
  }

  private addToCartWithClient(cd: Cd, clientId: number): void {
    if (!cd?.ativo || (cd.estoque ?? 0) <= 0) return;

    this.cart.addItem({
      cdId: cd.id,
      titulo: cd.titulo,
      valorUnitario: cd.valorVenda,
      quantidade: 1,
      clientId: clientId
    });
  }

  giveFeedback(productId: number, liked: boolean): void {
    const clientId = this.selectedClientId || this.auth.getClientId() || this.auth.getUserId();
    if (!clientId) {
      alert('Faça login para dar feedback');
      return;
    }

    this.feedbackService.create({ clientId, productId, liked }).subscribe({
      next: () => {
      },
      error: (err) => {
        console.error('Erro ao salvar feedback:', err);
      }
    });
  }
}
