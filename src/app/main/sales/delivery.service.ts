import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DeliveryAddress } from '../../shared/model/sales/sales';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private addressesSubject = new BehaviorSubject<DeliveryAddress[]>([]);
  public addresses$ = this.addressesSubject.asObservable();

  constructor() {
    this.loadAddresses();
  }

  private loadAddresses(): void {
    const saved = localStorage.getItem('delivery_addresses');
    if (saved) {
      try {
        const addresses = JSON.parse(saved);
        this.addressesSubject.next(addresses);
      } catch {
        this.addressesSubject.next([]);
      }
    }
  }

  private saveAddresses(): void {
    localStorage.setItem('delivery_addresses', JSON.stringify(this.addressesSubject.value));
  }

  getAddressesByClient(clientId: number): DeliveryAddress[] {
    return this.addressesSubject.value.filter(address => 
      address.clientId === clientId && address.isActive
    );
  }

  getDefaultAddress(clientId: number): DeliveryAddress | undefined {
    return this.addressesSubject.value.find(address => 
      address.clientId === clientId && address.isDefault && address.isActive
    );
  }

  addAddress(address: Omit<DeliveryAddress, 'id'>): DeliveryAddress {
    const newAddress: DeliveryAddress = {
      ...address,
      id: this.generateAddressId(),
      isActive: true
    };

    const addresses = this.addressesSubject.value;

    const clientAddresses = addresses.filter(a => a.clientId === address.clientId);
    if (clientAddresses.length === 0) {
      newAddress.isDefault = true;
    }

    if (newAddress.isDefault) {
      addresses.forEach(addr => {
        if (addr.clientId === address.clientId) {
          addr.isDefault = false;
        }
      });
    }

    addresses.push(newAddress);
    this.addressesSubject.next([...addresses]);
    this.saveAddresses();

    return newAddress;
  }

  updateAddress(address: DeliveryAddress): boolean {
    const addresses = this.addressesSubject.value;
    const index = addresses.findIndex(a => a.id === address.id);
    
    if (index !== -1) {

      if (address.isDefault) {
        addresses.forEach(addr => {
          if (addr.clientId === address.clientId && addr.id !== address.id) {
            addr.isDefault = false;
          }
        });
      }

      addresses[index] = address;
      this.addressesSubject.next([...addresses]);
      this.saveAddresses();
      return true;
    }

    return false;
  }

  deleteAddress(addressId: number): boolean {
    const addresses = this.addressesSubject.value;
    const index = addresses.findIndex(a => a.id === addressId);
    
    if (index !== -1) {
      addresses[index].isActive = false;
      this.addressesSubject.next([...addresses]);
      this.saveAddresses();
      return true;
    }

    return false;
  }

  setDefaultAddress(addressId: number, clientId: number): boolean {
    const addresses = this.addressesSubject.value;

    addresses.forEach(address => {
      if (address.clientId === clientId) {
        address.isDefault = false;
      }
    });

    const targetAddress = addresses.find(a => a.id === addressId && a.clientId === clientId);
    if (targetAddress) {
      targetAddress.isDefault = true;
      this.addressesSubject.next([...addresses]);
      this.saveAddresses();
      return true;
    }

    return false;
  }

  validateAddress(address: Partial<DeliveryAddress>): { valid: boolean; error?: string } {
    if (!address.name || address.name.trim().length < 2) {
      return { valid: false, error: 'Nome do endereço é obrigatório' };
    }

    if (!address.street || address.street.trim().length < 3) {
      return { valid: false, error: 'Rua é obrigatória' };
    }

    if (!address.number || address.number.trim().length < 1) {
      return { valid: false, error: 'Número é obrigatório' };
    }

    if (!address.neighborhood || address.neighborhood.trim().length < 2) {
      return { valid: false, error: 'Bairro é obrigatório' };
    }

    if (!address.city || address.city.trim().length < 2) {
      return { valid: false, error: 'Cidade é obrigatória' };
    }

    if (!address.state || address.state.trim().length < 2) {
      return { valid: false, error: 'Estado é obrigatório' };
    }

    if (!address.zipCode || !this.validateZipCode(address.zipCode)) {
      return { valid: false, error: 'CEP inválido' };
    }

    return { valid: true };
  }

  private validateZipCode(zipCode: string): boolean {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    return cleanZipCode.length === 8;
  }

  private generateAddressId(): number {
    const addresses = this.addressesSubject.value;
    const maxId = addresses.reduce((max, address) => Math.max(max, address.id || 0), 0);
    return maxId + 1;
  }

  calculateShipping(zipCode: string, totalWeight: number): Promise<{ value: number; deliveryDays: number; carrier: string }> {
    return new Promise((resolve) => {

      setTimeout(() => {
        const baseShipping = 15; // R$ 15 base
        const weightFactor = Math.ceil(totalWeight / 1000) * 5; // R$ 5 por kg
        const shipping = baseShipping + weightFactor;

        const carriers = ['Correios', 'Transportadora ABC', 'Logística XYZ'];
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];

        const deliveryDays = Math.floor(Math.random() * 5) + 3; // 3 a 7 dias

        resolve({
          value: shipping,
          deliveryDays,
          carrier
        });
      }, 1000);
    });
  }

  formatZipCode(zipCode: string): string {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      return `${cleanZipCode.slice(0, 5)}-${cleanZipCode.slice(5)}`;
    }
    return zipCode;
  }

  searchZipCode(zipCode: string): Promise<{ street?: string; neighborhood?: string; city?: string; state?: string; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {

        const mockData = {
          '01310-100': {
            street: 'Avenida Paulista',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP'
          },
          '20040-020': {
            street: 'Rua da Carioca',
            neighborhood: 'Centro',
            city: 'Rio de Janeiro',
            state: 'RJ'
          }
        };

        const cleanZipCode = zipCode.replace(/\D/g, '');
        const formattedZipCode = `${cleanZipCode.slice(0, 5)}-${cleanZipCode.slice(5)}`;
        
        const data = mockData[formattedZipCode as keyof typeof mockData];
        
        if (data) {
          resolve(data);
        } else {
          resolve({ error: 'CEP não encontrado' });
        }
      }, 500);
    });
  }
}

