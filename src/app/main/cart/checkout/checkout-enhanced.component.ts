import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../sales/sales.service';
import { CouponService } from '../../sales/coupon.service';
import { PaymentService } from '../../sales/payment.service';
import { DeliveryService } from '../../sales/delivery.service';
import { ClientService } from '../../clients/clients.service';
import { 
  CartSummary, 
  Coupon, 
  CreditCard, 
  DeliveryAddress, 
  PaymentMethod 
} from '../../shared/model/sales/sales';
import { Client } from '../../shared/model/client/client';
import { faCreditCard, faMapMarkerAlt, faTicketAlt, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-checkout-enhanced',
  templateUrl: './checkout-enhanced.component.html',
  styleUrls: ['./checkout-enhanced.component.scss']
})
export class CheckoutEnhancedComponent implements OnInit, OnDestroy {
calcFrete() {
throw new Error('Method not implemented.');
}

  checkoutForm!: FormGroup;
  couponForm!: FormGroup;
  paymentForm!: FormGroup;
  addressForm!: FormGroup;

  cartSummary!: CartSummary;
  clients: Client[] = [];
  availableCoupons: Coupon[] = [];
  clientAddresses: DeliveryAddress[] = [];
  clientCreditCards: CreditCard[] = [];
  selectedClient: Client | null = null;

  currentStep = 1;
  totalSteps = 4;
  isLoading = false;
  couponError = '';
  paymentError = '';
  addressError = '';

  faCreditCard = faCreditCard;
  faMapMarkerAlt = faMapMarkerAlt;
  faTicketAlt = faTicketAlt;
  faShoppingCart = faShoppingCart;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService,
    private couponService: CouponService,
    private paymentService: PaymentService,
    private deliveryService: DeliveryService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.salesService.clearLocalCheckoutCoupon();
    this.loadData();
    this.subscribeToCartChanges();

    const checkoutReturn = sessionStorage.getItem('checkout_return');
    if (checkoutReturn) {
      try {
        const returnData = JSON.parse(checkoutReturn);
        sessionStorage.removeItem('checkout_return');
        const clientId = returnData.clientId;
        this.checkoutForm.get('clientId')?.setValue(clientId);
        this.currentStep = returnData.step || 3;
        this.onClientChange();
        
        setTimeout(() => {
          this.loadClientData(clientId);
        }, 300);
      } catch (e) {
        console.error('Erro ao restaurar checkout:', e);
      }
    }

    this.paymentForm.get('creditCardId')?.valueChanges.subscribe(() => {
      this.onCreditCardChange();
    });
  }

  ngOnDestroy(): void {
    this.salesService.clearLocalCheckoutCoupon();
  }

  private initializeForms(): void {
    this.checkoutForm = this.fb.group({
      clientId: ['', Validators.required],
      deliveryAddressId: ['', Validators.required],
      paymentMethods: this.fb.array([]),
      notes: ['']
    });

    this.couponForm = this.fb.group({
      couponCode: ['', Validators.required]
    });

    this.paymentForm = this.fb.group({
      paymentType: ['CREDIT_CARD', Validators.required],
      creditCardId: [''],
      newCard: this.fb.group({
        cardNumber: [''],
        cardHolder: [''],
        expiryDate: [''],
        cvv: ['']
      }),
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.addressForm = this.fb.group({
      name: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      complement: [''],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]]
    });
  }

  private loadData(): void {

    this.clientService.clients$.subscribe(clients => {
      this.clients = clients.filter(c => c.ativo);
    });

    this.availableCoupons = this.couponService.getActiveCoupons();

    this.updateCartSummary();
  }

  private subscribeToCartChanges(): void {
    this.salesService.cart$.subscribe(() => {
      this.updateCartSummary();
    });
  }

  private updateCartSummary(): void {
    this.cartSummary = this.salesService.getCartSummary();
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    this.currentStep--;
    if (this.currentStep === 1) {
      this.salesService.clearLocalCheckoutCoupon();
    }
  }

  cancelCheckout(): void {
    this.salesService.clearLocalCheckoutCoupon();
    this.salesService.clearCart();
    this.router.navigate(['/app/cart']);
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validateClientSelection();
      case 2:
        return this.validateAddressSelection();
      case 3:
        return this.validatePaymentSelection();
      case 4:
        return true;
      default:
        return false;
    }
  }

  onClientChange(): void {
    const clientId = this.checkoutForm.get('clientId')?.value;
    if (clientId) {
      this.selectedClient = this.clients.find(c => c.id === clientId) || null;
      this.salesService.setClient(clientId);
      this.loadClientData(clientId);
    }
  }

  onCreditCardChange(): void {
    const cardId = this.paymentForm.get('creditCardId')?.value;
    if (cardId === 'NEW_CARD') {
      const clientId = this.checkoutForm.get('clientId')?.value;
      if (clientId) {
        sessionStorage.setItem('checkout_return', JSON.stringify({
          clientId: clientId,
          step: this.currentStep
        }));
        this.router.navigate(['/app/clients/edit', clientId], { queryParams: { returnToCheckout: true } });
      } else {
        alert('Selecione um cliente primeiro');
        this.paymentForm.get('creditCardId')?.setValue('');
      }
    }
  }

  private loadClientData(clientId: number): void {
    this.clientAddresses = this.deliveryService.getAddressesByClient(clientId);
    this.clientCreditCards = this.paymentService.getCreditCardsByClient(clientId);
    
    setTimeout(() => {
      this.clientAddresses = this.deliveryService.getAddressesByClient(clientId);
      this.clientCreditCards = this.paymentService.getCreditCardsByClient(clientId);
    }, 100);
  }

  private validateClientSelection(): boolean {
    const clientId = this.checkoutForm.get('clientId')?.value;
    if (!clientId) {
      alert('Selecione um cliente');
      return false;
    }
    return true;
  }

  onAddressChange(): void {
    const addressId = this.checkoutForm.get('deliveryAddressId')?.value;
    if (addressId === 'NEW_ADDRESS') {
      const clientId = this.checkoutForm.get('clientId')?.value;
      if (clientId) {
        sessionStorage.setItem('checkout_return', JSON.stringify({
          clientId: clientId,
          step: this.currentStep
        }));
        this.router.navigate(['/app/profile'], { queryParams: { returnToCheckout: true } });
      } else {
        alert('Selecione um cliente primeiro');
        this.checkoutForm.get('deliveryAddressId')?.setValue('');
      }
    } else if (addressId) {
      const address = this.clientAddresses.find(a => a.id === addressId);
      if (address) {
        this.salesService.setDeliveryAddress(address);
        this.updateCartSummary();
      }
    }
  }

  searchZipCode(): void {
    const zipCode = this.addressForm.get('zipCode')?.value;
    if (zipCode) {
      this.deliveryService.searchZipCode(zipCode).then(result => {
        if (result.error) {
          this.addressError = result.error;
        } else {
          this.addressForm.patchValue({
            street: result.street,
            neighborhood: result.neighborhood,
            city: result.city,
            state: result.state
          });
          this.addressError = '';
        }
      });
    }
  }

  private validateAddressSelection(): boolean {
    const addressId = this.checkoutForm.get('deliveryAddressId')?.value;
    if (!addressId) {
      alert('Selecione um endereço de entrega');
      return false;
    }
    return true;
  }

  addPaymentMethod(): void {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      const paymentType = formValue.paymentType;
      
      if (paymentType === 'CREDIT_CARD') {
        this.addCreditCardPayment(formValue);
      }
      
      this.paymentForm.reset();
      this.paymentForm.get('paymentType')?.setValue('CREDIT_CARD');
    } else {
      this.paymentForm.markAllAsTouched();
    }
  }

  private addCreditCardPayment(formValue: any): void {
    const clientId = this.checkoutForm.get('clientId')?.value;
    let creditCard: CreditCard;

    if (formValue.creditCardId) {

      creditCard = this.clientCreditCards.find(c => c.id === formValue.creditCardId)!;
    } else {

      const newCardData = formValue.newCard;
      const validation = this.paymentService.validateCreditCard({
        ...newCardData,
        clientId
      });

      if (!validation.valid) {
        this.paymentError = validation.error || 'Cartão inválido';
        return;
      }

      creditCard = this.paymentService.addCreditCard({
        ...newCardData,
        clientId,
        isDefault: this.clientCreditCards.length === 0
      });

      this.clientCreditCards.push(creditCard);
    }

    const paymentMethod: PaymentMethod = {
      type: 'CREDIT_CARD',
      creditCards: [creditCard],
      totalAmount: formValue.amount
    };

    this.salesService.addPaymentMethod(paymentMethod);
    this.updateCartSummary();
    this.paymentError = '';
  }

  removePaymentMethod(index: number): void {
    this.salesService.removePaymentMethod(index);
    this.updateCartSummary();
  }

  private validatePaymentSelection(): boolean {
    const paymentMethods = this.salesService.getPaymentMethods();
    if (paymentMethods.length === 0) {
      alert('Adicione pelo menos um método de pagamento');
      return false;
    }

    const totalPaymentAmount = paymentMethods.reduce((sum, method) => sum + method.totalAmount, 0);
    if (Math.abs(totalPaymentAmount - this.cartSummary.total) > 0.01) {
      alert('O valor total dos pagamentos deve ser igual ao valor do pedido');
      return false;
    }

    return true;
  }

  applyCoupon(): void {
    const couponCode = this.couponForm.get('couponCode')?.value;
    if (!couponCode) {
      return;
    }

    const codeUpper = couponCode.toUpperCase().trim();

    if (codeUpper === 'COMPRA1') {
      const result = this.salesService.setLocalCheckoutCoupon(couponCode);
      if (result.success) {
        this.updateCartSummary();
        this.couponForm.reset();
        this.couponError = '';
        alert('Cupom COMPRA1 será aplicado no final do checkout. O desconto será calculado com base no valor total do pedido.');
      } else {
        this.couponError = result.error || 'Erro ao aplicar cupom';
      }
      return;
    }

    this.salesService.applyCoupon(couponCode).subscribe({
      next: (result) => {
        if (result.success) {
          this.updateCartSummary();
          this.couponForm.reset();
          this.couponError = '';
        } else {
          this.couponError = result.error || 'Erro ao aplicar cupom';
        }
      },
      error: (err) => {
        console.error('Erro ao aplicar cupom:', err);
        this.couponError = err?.error?.message || 'Erro ao aplicar cupom. Tente novamente.';
      }
    });
  }

  removeCoupon(couponId: string): void {
    this.salesService.removeCoupon(couponId);
    this.updateCartSummary();
  }

  async finalizeOrder(): Promise<void> {
    this.isLoading = true;
    
    try {
      const result = await this.salesService.finalizeOrder();
      
      if (result.success && result.order) {
        alert(`Pedido criado com sucesso!\nNúmero do pedido: ${result.order.orderNumber}`);
        this.router.navigate(['/app/orders/view', result.order.id || result.order.orderNumber]);
      } else {
        alert(`Erro ao finalizar pedido: ${result.error}`);
      }
    } catch (error) {
      alert('Erro interno do sistema');
    } finally {
      this.isLoading = false;
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatCardNumber(cardNumber: string): string {
    return this.paymentService.maskCardNumber(cardNumber);
  }

  formatZipCode(zipCode: string): string {
    return this.deliveryService.formatZipCode(zipCode);
  }

  getStepTitle(step: number): string {
    const titles = [
      '', 
      'Selecionar Cliente',
      'Endereço de Entrega',
      'Forma de Pagamento',
      'Confirmação'
    ];
    return titles[step] || '';
  }

  getStepIcon(step: number): any {
    const icons = [
      null,
      this.faShoppingCart,
      this.faMapMarkerAlt,
      this.faCreditCard,
      this.faTicketAlt
    ];
    return icons[step] || null;
  }
}
