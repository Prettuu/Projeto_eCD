import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../cart.service';
import { StockService } from '../../stock/stock.service';
import { ClientService } from '../../clients/clients.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  state = this.cart.get();

  constructor(
    public cart: CartService,
    private stock: StockService,
    private router: Router,
    private auth: AuthService,
    private clientsService: ClientService
  ) {}

  ngOnInit(): void {
    this.cart.clearCoupons();
    this.resolveClientFromEmail();
    this.refresh();
    
    const clientId = this.cart.selectedClientId;
    if (clientId) {
      this.loadCartFromDatabase(clientId);
    }
  }

  private loadCartFromDatabase(clientId: number): void {
    this.cart.loadFromDatabase(clientId).subscribe({
      next: () => {
        this.refresh();
      },
      error: (err) => {
        console.error('Erro ao carregar carrinho do banco:', err);
      }
    });
  }

  refresh(): void {
    this.state = this.cart.get();
  }

  get subtotal(): number {
    return this.state.items.reduce(
      (s: number, it: CartItem) => s + it.valorUnitario * it.quantidade,
      0
    );
  }
  get desconto(): number {
    return Number(this.state.desconto ?? 0);
  }
  get frete(): number {
    return Number(this.state.frete ?? 0);
  }
  get total(): number {
    return Number((this.subtotal - this.desconto + this.frete).toFixed(2));
  }

  updateQty(it: CartItem, qtd: number): void {
    const cd = this.stock.getByIdSync(it.cdId);
    if (!cd) return;
    const max = Number(cd.estoque ?? 0);
    const val = Math.max(0, Math.min(max, Number(qtd)));
    this.cart.updateQty(it.cdId, val, this.state.clientId);
    this.refresh();
  }

  remove(it: CartItem): void {
    this.cart.remove(it.cdId, this.state.clientId);
    this.refresh();
  }

  applyCoupon(code: string): void {
    this.cart.applyCoupon(code);
    this.refresh();
  }


  goCheckout(): void {
    this.cart.clearCoupons();
    this.router.navigate(['/app/cart/checkout']);
  }

  clear(): void {
    if (this.state.clientId) {
      this.cart.clearForClient(this.state.clientId);
    } else {
      this.cart.clearAll();
    }
    this.cart.clearCoupons();
    this.refresh();
  }

  private resolveClientFromEmail(): void {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    this.clientsService.getAll().subscribe({
      next: (list) => {
        const client = (list || []).find((c: any) => c.email === email);
        if (client?.id) {
          this.cart.setClient(client.id);
          this.loadCartFromDatabase(client.id);
          this.refresh();
        }
      },
      error: () => {}
    });
  }
}

