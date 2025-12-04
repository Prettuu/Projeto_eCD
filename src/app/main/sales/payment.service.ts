import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreditCard, PaymentMethod } from '../../shared/model/sales/sales';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private creditCardsSubject = new BehaviorSubject<CreditCard[]>([]);
  public creditCards$ = this.creditCardsSubject.asObservable();

  constructor() {
    this.loadCreditCards();
  }

  private loadCreditCards(): void {

    const saved = localStorage.getItem('credit_cards');
    if (saved) {
      try {
        const cards = JSON.parse(saved);
        this.creditCardsSubject.next(cards);
      } catch {
        this.creditCardsSubject.next([]);
      }
    }
  }

  private saveCreditCards(): void {
    localStorage.setItem('credit_cards', JSON.stringify(this.creditCardsSubject.value));
  }

  getCreditCardsByClient(clientId: number): CreditCard[] {
    return this.creditCardsSubject.value.filter(card => 
      card.clientId === clientId && card.isActive
    );
  }

  addCreditCard(card: Omit<CreditCard, 'id'>): CreditCard {
    const newCard: CreditCard = {
      ...card,
      id: this.generateCardId(),
      isActive: true
    };

    const cards = this.creditCardsSubject.value;
    cards.push(newCard);
    this.creditCardsSubject.next([...cards]);
    this.saveCreditCards();

    return newCard;
  }

  updateCreditCard(card: CreditCard): boolean {
    const cards = this.creditCardsSubject.value;
    const index = cards.findIndex(c => c.id === card.id);
    
    if (index !== -1) {
      cards[index] = card;
      this.creditCardsSubject.next([...cards]);
      this.saveCreditCards();
      return true;
    }

    return false;
  }

  deleteCreditCard(cardId: number): boolean {
    const cards = this.creditCardsSubject.value;
    const index = cards.findIndex(c => c.id === cardId);
    
    if (index !== -1) {
      cards[index].isActive = false;
      this.creditCardsSubject.next([...cards]);
      this.saveCreditCards();
      return true;
    }

    return false;
  }

  setDefaultCard(cardId: number, clientId: number): boolean {
    const cards = this.creditCardsSubject.value;

    cards.forEach(card => {
      if (card.clientId === clientId) {
        card.isDefault = false;
      }
    });

    const targetCard = cards.find(c => c.id === cardId && c.clientId === clientId);
    if (targetCard) {
      targetCard.isDefault = true;
      this.creditCardsSubject.next([...cards]);
      this.saveCreditCards();
      return true;
    }

    return false;
  }

  validateCreditCard(card: Partial<CreditCard>): { valid: boolean; error?: string } {
    if (!card.cardNumber || !this.validateCardNumber(card.cardNumber)) {
      return { valid: false, error: 'Número do cartão inválido' };
    }

    if (!card.cardHolder || card.cardHolder.trim().length < 3) {
      return { valid: false, error: 'Nome do portador inválido' };
    }

    if (!card.expiryDate || !this.validateExpiryDate(card.expiryDate)) {
      return { valid: false, error: 'Data de validade inválida' };
    }

    if (!card.cvv || !this.validateCVV(card.cvv)) {
      return { valid: false, error: 'CVV inválido' };
    }

    return { valid: true };
  }

  private validateCardNumber(cardNumber: string): boolean {

    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private validateExpiryDate(expiryDate: string): boolean {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) {
      return false;
    }

    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const now = new Date();

    return expiry > now;
  }

  private validateCVV(cvv: string): boolean {
    const cleanCVV = cvv.replace(/\D/g, '');
    return cleanCVV.length === 3 || cleanCVV.length === 4;
  }

  private generateCardId(): number {
    const cards = this.creditCardsSubject.value;
    const maxId = cards.reduce((max, card) => Math.max(max, card.id || 0), 0);
    return maxId + 1;
  }

  processPayment(paymentMethods: PaymentMethod[]): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    return new Promise((resolve) => {

      setTimeout(() => {

        const totalAmount = paymentMethods.reduce((sum, method) => sum + method.totalAmount, 0);

        if (totalAmount > 1000 && Math.random() < 0.1) {
          resolve({
            success: false,
            error: 'Pagamento rejeitado pela operadora'
          });
        } else {
          resolve({
            success: true,
            transactionId: this.generateTransactionId()
          });
        }
      }, 2000);
    });
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `TXN${timestamp}${random}`.toUpperCase();
  }

  formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  maskCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    if (cleanNumber.length < 8) return '****';
    
    const lastFour = cleanNumber.slice(-4);
    const masked = '*'.repeat(cleanNumber.length - 4);
    return `${masked}${lastFour}`;
  }
}

