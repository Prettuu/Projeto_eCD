import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationsService } from './notifications.service';
import { ClientService, Client } from '../clients/clients.service';

@Component({
  selector: 'app-notification-form',
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.scss']
})
export class NotificationFormComponent implements OnInit {
  form!: FormGroup;
  clients: Client[] = [];
  loading = false;
  sending = false;

  tipos = [
    { value: 'INFO', label: 'Informação', icon: 'ℹ️' },
    { value: 'ALERTA', label: 'Alerta', icon: '⚠️' },
    { value: 'PROMOCAO', label: 'Promoção', icon: '🎉' },
    { value: 'SISTEMA', label: 'Sistema', icon: '⚙️' }
  ];

  constructor(
    private fb: FormBuilder,
    private notificationsService: NotificationsService,
    private clientsService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      mensagem: ['', [Validators.required, Validators.minLength(10)]],
      tipo: ['INFO', Validators.required],
      enviarPara: ['todos', Validators.required], // 'todos' ou 'especifico'
      clientId: [null]
    });

    this.loadClients();

    this.form.get('enviarPara')?.valueChanges.subscribe(value => {
      const clientIdControl = this.form.get('clientId');
      if (value === 'especifico') {
        clientIdControl?.setValidators([Validators.required]);
      } else {
        clientIdControl?.clearValidators();
        clientIdControl?.setValue(null);
      }
      clientIdControl?.updateValueAndValidity();
    });
  }

  loadClients(): void {
    this.loading = true;
    this.clientsService.getAll().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    const formValue = this.form.value;

    const notificationData = {
      titulo: formValue.titulo,
      mensagem: formValue.mensagem,
      tipo: formValue.tipo,
      clientId: formValue.enviarPara === 'todos' ? null : formValue.clientId,
      lida: false
    };

    this.notificationsService.create(notificationData).subscribe({
      next: () => {
        alert('Notificação criada com sucesso!');
        this.router.navigate(['/app/notifications']);
      },
      error: (err) => {
        console.error('Erro ao criar notificação:', err);
        alert('Erro ao criar notificação. Tente novamente.');
        this.sending = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/app/notifications']);
  }

  getTipoIcon(tipo: string): string {
    const tipoObj = this.tipos.find(t => t.value === tipo);
    return tipoObj?.icon || 'ℹ️';
  }
}

