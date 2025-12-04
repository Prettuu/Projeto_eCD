import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { faCompactDisc, faSignOutAlt, faUser, faBell } from '@fortawesome/free-solid-svg-icons';
import { AuthService, UserRole } from '../../core/auth.service';
import { NotificationsService } from '../../main/notifications/notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  faCompactDisc = faCompactDisc;
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faBell = faBell;

  userRole: UserRole | null = null;
  userName: string | null = null;
  unreadCount = 0;
  private notificationsSubscription?: Subscription;

  get navFields() {
    if (this.userRole === 'ADMIN') {

      return [
        { label: 'Início', url: '/app/home' },
        { label: 'Clientes', url: '/app/clients' },
        { label: 'Estoque', url: '/app/stock' },
        { label: 'Pedidos', url: '/app/orders' },
        { label: 'Análise', url: '/app/analysis' },
      ];
    } else if (this.userRole === 'CLIENT') {

      return [
        { label: 'Início', url: '/app/home' },
        { label: 'Perfil', url: '/app/profile' },
        { label: 'Produtos', url: '/app/products' },
        { label: 'Pedidos', url: '/app/orders' },
        { label: 'Carrinho', url: '/app/cart' },
      ];
    } else {

      return [
        { label: 'Início', url: '/app/home' },
      ];
    }
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.userRole = this.auth.getRole();
    this.userName = this.auth.getNome();
    
    if (this.userRole === 'CLIENT' || this.userRole === 'ADMIN') {
      this.notificationsService.refresh();
      this.notificationsSubscription = this.notificationsService.getUnreadCount().subscribe(count => {
        this.unreadCount = count;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.notificationsSubscription) {
      this.notificationsSubscription.unsubscribe();
    }
  }

  goToNotifications(): void {
    this.router.navigate(['/app/notifications']);
  }

  goTo(url: string) {
    this.router.navigate([url]);
  }

  logout(): void {
    this.auth.logout();
  }

  getRoleLabel(): string {
    return this.userRole === 'ADMIN' ? 'Administrador' : 'Cliente';
  }
}
