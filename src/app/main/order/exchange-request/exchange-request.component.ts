import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderService } from '../order.service';
import { ExchangeService } from '../../sales/exchange.service';
import { ReturnService } from '../../sales/return.service';
import { CreateExchangeRequest } from '../../../shared/model/sales/exchange';
import { CreateReturnRequest } from '../../../shared/model/sales/return';

@Component({
  selector: 'app-exchange-request',
  templateUrl: './exchange-request.component.html',
  styleUrls: ['./exchange-request.component.scss']
})
export class ExchangeRequestComponent implements OnInit {
  order?: Order;
  type: 'exchange' | 'return' = 'exchange';
  
  form!: FormGroup;
  selectedItems: Set<number> = new Set();
  isLoading = false;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private exchangeService: ExchangeService,
    private returnService: ReturnService
  ) {}

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path || '';
    this.type = path.includes('return') ? 'return' : 'exchange';

    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.orderService.getById(Number(orderId)).subscribe({
        next: (order) => {
          this.order = order;
          this.initForm();
        },
        error: (err) => {
          console.error('Erro ao carregar pedido:', err);
          alert('Erro ao carregar pedido');
          this.router.navigate(['/app/orders']);
        }
      });
    } else {
      alert('Pedido não encontrado');
      this.router.navigate(['/app/orders']);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      motivo: ['', Validators.required],
      observacoes: [''],
      items: this.fb.array([])
    });

    if (this.order && this.order.items) {
      this.order.items.forEach(item => {
        this.items.push(this.fb.group({
          orderItemId: [item.id || item.productId || item.cdId],
          productId: [item.productId || item.cdId],
          selected: [false],
          quantidade: [0, [Validators.min(1)]],
          motivo: ['']
        }));
      });
    }
  }

  toggleItem(index: number): void {
    const itemControl = this.items.at(index);
    const selected = itemControl.get('selected')?.value;
    
    if (selected) {
      itemControl.get('quantidade')?.setValue(1);
      itemControl.get('quantidade')?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      itemControl.get('quantidade')?.setValue(0);
      itemControl.get('quantidade')?.clearValidators();
    }
    
    itemControl.get('quantidade')?.updateValueAndValidity();
  }

  getSelectedItemsCount(): number {
    return this.items.controls.filter(c => c.get('selected')?.value).length;
  }

  submit(): void {
    if (this.form.invalid || this.getSelectedItemsCount() === 0) {
      this.form.markAllAsTouched();
      if (this.getSelectedItemsCount() === 0) {
        alert('Selecione pelo menos um item para ' + (this.type === 'exchange' ? 'troca' : 'devolução'));
      }
      return;
    }

    this.isLoading = true;

    if (!this.order) {
      alert('Erro: Pedido não carregado');
      return;
    }

    const formValue = this.form.value;
    const selectedItems = this.items.controls
      .map((control, index) => ({
        control,
        originalItem: this.order!.items[index]
      }))
      .filter(({ control }) => control.get('selected')?.value)
      .map(({ control, originalItem }) => {
        const orderItemId = originalItem.id || originalItem.productId || originalItem.cdId!;
        
        console.log('Item selecionado:', {
          orderItemId,
          productId: originalItem.productId || originalItem.cdId,
          originalItem: originalItem
        });
        
        return {
          orderItemId: orderItemId,
          productId: originalItem.productId || originalItem.cdId!,
          quantidade: control.get('quantidade')?.value || 1,
          motivo: control.get('motivo')?.value || ''
        };
      });

    const request = {
      orderId: this.order.id,
      clientId: this.order.clientId,
      motivo: formValue.motivo,
      observacoes: formValue.observacoes || undefined,
      items: selectedItems
    };

    if (this.type === 'exchange') {
      this.exchangeService.create(request as CreateExchangeRequest).subscribe({
        next: () => {
          alert('Solicitação de troca criada com sucesso!');
          this.router.navigate(['/app/orders/view', this.order!.id]);
        },
        error: (err) => {
          console.error('Erro ao criar troca:', err);
          const errorMessage = err?.error?.message || err?.message || 'Erro desconhecido';
          alert(`Erro ao criar solicitação de troca: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      this.returnService.create(request as CreateReturnRequest).subscribe({
        next: () => {
          alert('Solicitação de devolução criada com sucesso!');
          this.router.navigate(['/app/orders/view', this.order!.id]);
        },
        error: (err) => {
          console.error('Erro ao criar devolução:', err);
          const errorMessage = err?.error?.message || err?.message || 'Erro desconhecido';
          alert(`Erro ao criar solicitação de devolução: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    if (this.order) {
      this.router.navigate(['/app/orders/view', this.order.id]);
    } else {
      this.router.navigate(['/app/orders']);
    }
  }
}

