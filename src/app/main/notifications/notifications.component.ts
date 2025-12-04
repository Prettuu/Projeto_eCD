import { Component, OnInit } from '@angular/core';
import { NotificationsService, Notification } from './notifications.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;
  unreadCount = 0;
  isAdmin = false;

  constructor(
    private notificationsService: NotificationsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.getRole() === 'ADMIN';
    this.loadNotifications();
    this.notificationsService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationsService.getAll().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar notificações:', err);
        this.loading = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    if (notification.lida) return;

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.lida = true;
        this.notificationsService.refresh();
      },
      error: (err) => {
        console.error('Erro ao marcar como lida:', err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.lida = true);
        this.notificationsService.refresh();
      },
      error: (err) => {
        console.error('Erro ao marcar todas como lidas:', err);
      }
    });
  }

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'ALERTA': return '⚠️';
      case 'PROMOCAO': return '🎉';
      case 'SISTEMA': return '⚙️';
      default: return 'ℹ️';
    }
  }

  getTipoClass(tipo: string): string {
    return `notification-type-${tipo.toLowerCase()}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

