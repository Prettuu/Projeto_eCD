import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../cart.service';
import { OrderService } from '../../order/order.service';
import { StockService } from '../../stock/stock.service';
import { ClientService } from '../../clients/clients.service';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  form!: FormGroup;
  state = this.cart.get();
  couponCode: string = '';
  clientCards: any[] = [];
  selectedCardId: number | null = null;

  constructor(
    private fb: FormBuilder,
    public cart: CartService,
    private orders: OrderService,
    private stock: StockService,
    private clientsService: ClientService,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const checkoutReturn = sessionStorage.getItem('checkout_return');
    if (checkoutReturn) {
      try {
        const returnData = JSON.parse(checkoutReturn);
        sessionStorage.removeItem('checkout_return');
        if (returnData.clientId) {
          this.cart.setClient(returnData.clientId);
        }
      } catch (e) {
        console.error('Erro ao restaurar checkout:', e);
      }
    }

    this.resolveClientFromEmail();

    this.form = this.fb.group({
      cep: ['', [Validators.required, Validators.minLength(8)]],
      endereco: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      cupom: [''],
      paymentType: ['ONE', Validators.required], // 'ONE' or 'TWO'
      cardId: [null],
      cardId2: [null],
      amount1: [null],
      amount2: [null]
    });

    this.prefillAddressFromClient();

    this.cart.selectedClientId$.subscribe(() => {
      this.prefillAddressFromClient();
      this.loadClientCards();
    });

    this.state = this.cart.get();

    setTimeout(() => {
      this.loadClientCards();
      
      // Restore payment state if returning from profile/edit
      const checkoutReturn = sessionStorage.getItem('checkout_return');
      if (checkoutReturn) {
        try {
          const returnData = JSON.parse(checkoutReturn);
          if (returnData.paymentType) {
            this.form.patchValue({
              paymentType: returnData.paymentType,
              cardId: returnData.cardId || null,
              cardId2: returnData.cardId2 || null,
              amount1: returnData.amount1 || null,
              amount2: returnData.amount2 || null
            });
            sessionStorage.removeItem('checkout_return');
          }
        } catch (e) {
          console.error('Erro ao restaurar estado do pagamento:', e);
        }
      }
    }, 300);
  }

  private resolveClientFromEmail(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      console.warn('No userId found in auth service');
      return;
    }

    this.cart.setClient(userId);
    this.state = this.cart.get();
    this.prefillAddressFromClient();
    this.loadClientCards();
  }

loadClientCards(): void {
  const clientId = this.state.clientId;
  
  if (!clientId) {
    console.warn('No client ID found, resolving by email...');
    this.resolveClientFromEmail();
    return;
  }

  this.clientsService.getById(clientId).subscribe({
    next: (client: any) => {
      let cards = client?.cartoes || client?.cartao || client?.cards || [];

      if (typeof cards === 'string') {
        try {
          cards = JSON.parse(cards);
        } catch (e) {
          console.warn('Cartões não estavam em formato JSON:', cards);
          cards = [];
        }
      }

      if (!Array.isArray(cards)) {
        cards = [];
      }

      this.clientCards = cards.map((c: any, i: number) => ({
        id: c.id || i + 1,
        numero: c.numero || c.cardNumber || '',
        bandeira: c.bandeira || c.brand || 'Cartão',
        validade: c.validade || '',
        titular: c.titular || ''
      }));
      
      if (this.clientCards.length === 0) {
        console.warn('Nenhum cartão encontrado para o cliente');
      }
    },
    error: (err) => {
      console.error('Erro ao carregar cartões:', err);
      this.clientCards = [];
    }
  });
}

  applyCoupon(): void {
    const code = this.form.get('cupom')?.value?.trim();
    if (!code) {
      alert('Informe o código do cupom.');
      return;
    }

    this.cart.applyCoupon(code).subscribe({
      next: (result) => {
        if (result.success) {
          this.state = { ...this.cart.get() };
        } else {
          alert(result.error || 'Erro ao aplicar cupom');
        }
      },
      error: (err) => {
        console.error('Erro ao aplicar cupom:', err);
        alert('Erro ao aplicar cupom. Tente novamente.');
      }
    });
  }

  calcFrete(): void {
    const cep = this.form.get('cep')?.value;
    if (!cep || cep.length < 8) return;

    const frete = 10;
    const st = this.cart.get();
    st.frete = frete;
    this.state = { ...st, totalComDesconto: st.totalComDesconto + frete };
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const resumo = this.cart.get();
    if (!resumo.items.length || !resumo.clientId) {
      alert('Carrinho vazio ou cliente não selecionado.');
      return;
    }

    this.clientsService.getById(Number(resumo.clientId)).subscribe(cliente => {
      const items = resumo.items.map(it => ({
        cdId: it.cdId,
        titulo: it.titulo,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        subtotal: it.valorUnitario * it.quantidade,
      }));

      const total = resumo.totalComDesconto ?? resumo.subtotal;

      // build payment payload
      const paymentType = this.form.get('paymentType')?.value;
      let payment: any = { type: paymentType };

      if (paymentType === 'ONE') {
        const card = this.form.get('cardId')?.value;
        if (!card) {
          alert('Selecione um cartão para pagamento.');
          return;
        }
        payment.cardId = card;
        payment.amounts = [Number(total)];
      } else if (paymentType === 'TWO') {
        const card1 = this.form.get('cardId')?.value;
        const card2 = this.form.get('cardId2')?.value;
        const amount1 = Number(this.form.get('amount1')?.value || 0);
        const amount2 = Number(this.form.get('amount2')?.value || 0);

        if (!card1 || !card2) {
          alert('Selecione os dois cartões.');
          return;
        }

        if (amount1 <= 0 || amount2 <= 0) {
          alert('Informe valores válidos para os dois cartões.');
          return;
        }

        const sum = Number((amount1 + amount2).toFixed(2));
        const expected = Number(Number(total).toFixed(2));

        if (Math.abs(sum - expected) > 0.01) {
          alert('A soma dos dois valores deve ser igual ao valor total da compra.');
          return;
        }

        payment.cardIds = [card1, card2];
        payment.amounts = [amount1, amount2];
      }

      this.orders.create({
        clientId: resumo.clientId!,
        clientName: cliente?.nome || 'Cliente',
        items,
        total,
        desconto: resumo.desconto || 0,
        cupom: resumo.cupom || null,
        payment
      }).subscribe({
        next: (newOrder) => {
          if (!newOrder) {
            alert('Falha ao criar pedido.');
            return;
          }

          // show confirmation based on payment
          const paymentPayload = this.form.get('paymentType')?.value === 'ONE'
            ? this.form.get('cardId')?.value
            : `${this.form.get('cardId')?.value} + ${this.form.get('cardId2')?.value}`;

          alert(`Pedido criado com sucesso! `);

          this.orders.transition(newOrder.id, 'APROVADA', 'checkout').subscribe({
            next: () => {
              this.cart.clearAll();
              this.router.navigate(['/app/orders/view', newOrder.id]);
            },
            error: (err) => {
              console.error('Erro ao fazer transição do pedido:', err);
              this.cart.clearAll();
              this.router.navigate(['/app/orders/view', newOrder.id]);
            }
          });
        },
        error: (err) => {
          console.error('Erro ao criar pedido:', err);
          alert('Erro ao criar pedido. Tente novamente.');
        }
      });
    });
  }

  cancelar(): void {
    this.router.navigate(['/app/cart']);
  }

  onPaymentTypeChange(): void {
    const paymentType = this.form.get('paymentType')?.value;

    // Update validators based on payment type
    if (paymentType === 'ONE') {
      // Single card mode: cardId required, cardId2 optional
      this.form.get('cardId')?.setValidators([Validators.required]);
      this.form.get('cardId2')?.clearValidators();
      // Clear values for two-card fields
      this.form.get('cardId2')?.setValue(null);
      this.form.get('amount1')?.setValue(null);
      this.form.get('amount2')?.setValue(null);
    } else if (paymentType === 'TWO') {
      // Two-card mode: both cards required
      this.form.get('cardId')?.setValidators([Validators.required]);
      this.form.get('cardId2')?.setValidators([Validators.required]);
    }

    // Update form validity
    this.form.get('cardId')?.updateValueAndValidity();
    this.form.get('cardId2')?.updateValueAndValidity();
  }

  onCardChange(): void {
    const cardId = this.form.get('cardId')?.value;
    const cardId2 = this.form.get('cardId2')?.value;
    const paymentType = this.form.get('paymentType')?.value;
    const clientId = this.state.clientId;

    // Handle NEW_CARD selection for cardId (single or two-card mode)
    if (cardId === 'NEW_CARD') {
      if (clientId) {
        this.form.get('cardId')?.clearValidators();
        this.form.get('cardId')?.updateValueAndValidity();

        sessionStorage.setItem('checkout_return', JSON.stringify({
          clientId: clientId,
          paymentType: paymentType,
          cardId2: cardId2 || null,
          amount1: this.form.get('amount1')?.value || null,
          amount2: this.form.get('amount2')?.value || null,
          step: 3
        }));
        this.router.navigate(['/app/profile/edit', clientId], { queryParams: { returnToCheckout: true } });
      } else {
        alert('Cliente não identificado. Por favor, faça login novamente.');
        this.form.get('cardId')?.setValue(null);
      }
    } else {
      // cardId is always required when not NEW_CARD, regardless of payment type
      this.form.get('cardId')?.setValidators([Validators.required]);
      this.form.get('cardId')?.updateValueAndValidity();
    }

    // Handle NEW_CARD selection for cardId2 (two-card mode only)
    if (cardId2 === 'NEW_CARD') {
      if (clientId) {
        this.form.get('cardId2')?.clearValidators();
        this.form.get('cardId2')?.updateValueAndValidity();

        sessionStorage.setItem('checkout_return', JSON.stringify({
          clientId: clientId,
          paymentType: paymentType,
          cardId: cardId || null,
          amount1: this.form.get('amount1')?.value || null,
          amount2: this.form.get('amount2')?.value || null,
          step: 3
        }));
        this.router.navigate(['/app/profile/edit', clientId], { queryParams: { returnToCheckout: true } });
      } else {
        alert('Cliente não identificado. Por favor, faça login novamente.');
        this.form.get('cardId2')?.setValue(null);
      }
    } else {
      // cardId2 is only required when paymentType is 'TWO'
      if (paymentType === 'TWO') {
        this.form.get('cardId2')?.setValidators([Validators.required]);
      } else {
        this.form.get('cardId2')?.clearValidators();
      }
      this.form.get('cardId2')?.updateValueAndValidity();
    }
  }

  private prefillAddressFromClient(): void {
    const st = this.cart.get();
    const clientId = st.clientId;
    if (!clientId) { this.resolveClientFromEmail(); return; }

    this.clientsService.getById(Number(clientId)).subscribe((client: any) => {
    let e = client?.enderecoResidencial || {};
    if (typeof e === 'string') {
      try { e = JSON.parse(e); } catch { e = {}; }
    }
    if (!e || !e.cep) {
      console.warn('Nenhum endereço encontrado ou CEP ausente');
      return;
    }

    this.form.patchValue({
      cep: e.cep ?? '',
      endereco: e.logradouro ?? '',
      numero: e.numero ?? '',
      complemento: e.observacoes ?? ''
    }, { emitEvent: false });
  }, () => this.resolveClientFromEmail() );
}
}
