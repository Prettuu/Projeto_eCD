import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService, Client } from '../clients.service';
import { AuthService } from '../../../core/auth.service';
import { PaymentService } from '../../sales/payment.service';
import { DeliveryService } from '../../sales/delivery.service';

@Component({
  selector: 'app-clients-form',
  templateUrl: './clients-form.component.html',
  styleUrls: ['./clients-form.component.scss']
})
export class ClientsFormComponent implements OnInit {
  clientForm!: FormGroup;
  id?: number;
  isProfileMode = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private paymentService: PaymentService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {

    this.isProfileMode = (this.route.parent?.snapshot.data['profileMode']) || this.router.url.startsWith('/app/profile');

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.isProfileMode && !this.id) {

      const clientId = this.auth.getClientId();
      this.id = clientId || this.auth.getUserId() || undefined;
    }
    
    this.clientForm = this.fb.group({
      genero: [null, Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      dataNascimento: ['', Validators.required],
      cpf: ['', Validators.required],
      telefone: this.fb.group({
        tipo: [null, Validators.required],
        ddd: ['', [Validators.required, Validators.minLength(2)]],
        numero: ['', [Validators.required, Validators.minLength(8)]],
      }),
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.minLength(6)],
      ativo: [true],

      enderecoResidencial: this.fb.group({
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        bairro: ['', Validators.required],
        cep: ['', Validators.required],
        cidade: ['', Validators.required],
        estado: ['', Validators.required],
        pais: ['', Validators.required],
        observacoes: [''],
        isCobranca: [false]
      }),
      enderecosEntrega: this.fb.array([]),
      cartoes: this.fb.array([])
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));

    const isRegisterRoute = this.router.url.includes('/register');
    if (!this.id && isRegisterRoute) {
      this.addCartao();
    }

    if (this.id) {
      this.clientService.getById(this.id).subscribe((cliente: any) => {
        if (!cliente) return;

        cliente.telefone = this.parseJson(cliente.telefone);
        cliente.enderecoResidencial = this.parseJson(cliente.enderecoResidencial);
        cliente.enderecosEntrega = this.parseJson(cliente.enderecosEntrega) || [];
        cliente.cartoes = this.parseJson(cliente.cartoes) || [];

        this.clientForm.patchValue({
          genero: cliente.genero,
          nome: cliente.nome,
          dataNascimento: cliente.dataNascimento,
          cpf: cliente.cpf,
          email: cliente.email,
          ativo: cliente.ativo
        });

        if (cliente.telefone) {
          this.clientForm.get('telefone')?.patchValue({
            tipo: cliente.telefone.tipo,
            ddd: cliente.telefone.ddd,
            numero: cliente.telefone.numero
          });
        }

        if (cliente.enderecoResidencial) {
          this.clientForm.get('enderecoResidencial')?.patchValue({
            logradouro: cliente.enderecoResidencial.logradouro,
            numero: cliente.enderecoResidencial.numero,
            bairro: cliente.enderecoResidencial.bairro,
            cep: cliente.enderecoResidencial.cep,
            cidade: cliente.enderecoResidencial.cidade,
            estado: cliente.enderecoResidencial.estado,
            pais: cliente.enderecoResidencial.pais,
            observacoes: cliente.enderecoResidencial.observacoes,
            isCobranca: cliente.enderecoResidencial.isCobranca
          });
        }

        (cliente.enderecosEntrega || []).forEach((e: any) =>
          this.enderecosEntrega.push(this.fb.group({
            logradouro: [e.logradouro, Validators.required],
            numero: [e.numero, Validators.required],
            bairro: [e.bairro, Validators.required],
            cep: [e.cep, Validators.required],
            cidade: [e.cidade, Validators.required],
            estado: [e.estado, Validators.required],
            pais: [e.pais, Validators.required],
            observacoes: [e.observacoes || '']
          }))
        );

        const cartoesCliente = cliente.cartoes || [];
        if (cartoesCliente.length > 0) {
          cartoesCliente.forEach((c: any) =>
            this.cartoes.push(this.fb.group({
              numero: [c.numero, Validators.required],
              nomeImpresso: [c.nomeImpresso, Validators.required],
              bandeira: [c.bandeira, [Validators.required, this.bandeiraValidator]],
              codigoSeguranca: [c.codigoSeguranca, Validators.required],
              preferencial: [!!c.preferencial]
            }))
          );
        } else {
          this.addCartao();
        }
      });
    }
  }

  passwordStrengthValidator = (control: any) => {
    if (!control.value) {
      return null;
    }
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length >= 6 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) {
      return null;
    }
    return { passwordWeak: true };
  }

  bandeiraValidator = (control: any) => {
    if (!control.value) {
      return null;
    }
    const bandeirasPermitidas = ['Visa', 'MasterCard', 'Elo', 'American Express', 'Hipercard'];
    if (bandeirasPermitidas.includes(control.value)) {
      return null;
    }
    return { bandeiraInvalida: true };
  }

  private parseJson(value: any): any {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  }

  get enderecosEntrega(): FormArray {
    return this.clientForm.get('enderecosEntrega') as FormArray;
  }

  get cartoes(): FormArray {
    return this.clientForm.get('cartoes') as FormArray;
  }

  addEnderecoEntrega(): void {
    this.enderecosEntrega.push(this.fb.group({
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      bairro: ['', Validators.required],
      cep: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
      pais: ['', Validators.required],
      observacoes: ['']
    }));
  }

  removeEnderecoEntrega(index: number): void {
    if (this.enderecosEntrega.length > 0) {
      this.enderecosEntrega.removeAt(index);
    }
  }

  addCartao(): void {
    this.cartoes.push(this.fb.group({
      numero: ['', Validators.required],
      nomeImpresso: ['', Validators.required],
      bandeira: ['', Validators.required],
      codigoSeguranca: ['', Validators.required],
      preferencial: [false]
    }));
  }

  removeCartao(index: number): void {
    if (this.cartoes.length > 0) {
      this.cartoes.removeAt(index);
    }
  }

  cancel(): void {
    if (this.isProfileMode) {
      this.router.navigate(['/app/profile']);
    } else {
      this.router.navigate(['/app/clients']);
    }
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      alert('Preencha todos os campos obrigatórios.');

      const firstInvalid = document.querySelector('.ng-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstInvalid as HTMLElement).focus();
      }
      return;
    }

    const payload: Client = this.clientForm.value;

    const returnToCheckout = this.route.snapshot.queryParams['returnToCheckout'] === 'true';
    
    if (this.id) {
      this.clientService.update(this.id, payload).subscribe(() => {
        const clientId = this.id!;
        
        const cartoesForm = this.cartoes.value || [];
        cartoesForm.forEach((cartao: any) => {
          if (cartao.numero && cartao.nomeImpresso && cartao.bandeira) {
            const existingCards = this.paymentService.getCreditCardsByClient(clientId);
            const exists = existingCards.some(c => 
              c.cardNumber.replace(/\s/g, '') === cartao.numero.replace(/\s/g, '')
            );
            
            if (!exists) {
              this.paymentService.addCreditCard({
                clientId: clientId,
                cardNumber: String(cartao.numero).replace(/\s/g, ''),
                cardHolder: String(cartao.nomeImpresso),
                expiryDate: '12/30',
                cvv: String(cartao.codigoSeguranca || ''),
                isDefault: !!cartao.preferencial,
                isActive: true
              });
            }
          }
        });
        
        const enderecosForm = this.enderecosEntrega.value || [];
        enderecosForm.forEach((endereco: any) => {
          if (endereco.logradouro && endereco.numero && endereco.bairro) {
            const existingAddresses = this.deliveryService.getAddressesByClient(clientId);
            const exists = existingAddresses.some(a => 
              a.street === endereco.logradouro && 
              a.number === endereco.numero
            );
            
            if (!exists) {
              this.deliveryService.addAddress({
                clientId: clientId,
                name: `Endereço ${existingAddresses.length + 1}`,
                street: String(endereco.logradouro),
                number: String(endereco.numero),
                complement: '',
                neighborhood: String(endereco.bairro),
                city: String(endereco.cidade),
                state: String(endereco.estado),
                zipCode: String(endereco.cep || '').replace(/\D/g, '') || '',
                isDefault: existingAddresses.length === 0,
                isActive: true
              });
            }
          }
        });
        
        if (returnToCheckout) {
          setTimeout(() => {
            this.router.navigate(['/app/cart/checkout']);
          }, 500);
        } else if (this.isProfileMode) {
          this.router.navigate(['/app/profile']);
        } else {
        this.router.navigate(['/app/clients']);
        }
      });
    } else {

      const isRegister = this.router.url.includes('/register');
      
      this.clientService.create(payload).subscribe({
        next: (client) => {
          if (isRegister) {
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            this.router.navigate(['/login']);
          } else {
            this.router.navigate(['/app/clients']);
          }
        },
        error: (err) => {
          alert(err?.error?.message || 'Erro ao criar cliente. Tente novamente.');
        }
      });
    }
  }

}
