import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { AuthGuard } from '../core/auth.guard';


const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [

      { path: '', redirectTo: 'home', pathMatch: 'full' },

      {
        path: 'home',
        loadChildren: () =>
          import('./home/home.module').then(m => m.HomeModule),
        data: { title: 'Início' }
      },

      {
        path: 'clients',
        loadChildren: () =>
          import('./clients/clients.module').then(m => m.ClientsModule),
        canActivate: [AuthGuard],
        data: { role: 'ADMIN', title: 'Clientes' }
      },

      {
        path: 'stock',
        loadChildren: () =>
          import('./stock/stock.module').then(m => m.StockModule),
        canActivate: [AuthGuard],
        data: { role: 'ADMIN', title: 'Estoque' }
      },

      {
        path: 'orders',
        loadChildren: () =>
          import('./order/order.module').then(m => m.OrderModule),
        canActivate: [AuthGuard],
        data: { title: 'Pedidos' }
      },

      {
        path: 'cart',
        loadChildren: () =>
          import('./cart/cart.module').then(m => m.CartModule),
        data: { title: 'Carrinho' }
      },

      {
        path: 'profile',
        loadChildren: () =>
          import('./clients/clients.module').then(m => m.ClientsModule),
        data: { title: 'Perfil', profileMode: true }
      },

      {
        path: 'products',
        loadChildren: () =>
          import('./stock/stock.module').then(m => m.StockModule),
        data: { title: 'Produtos', readonly: true }
      },

      {
        path: 'analysis',
        loadChildren: () =>
          import('./analysis/analysis.module').then(m => m.AnalysisModule),
        canActivate: [AuthGuard],
        data: { role: 'ADMIN', title: 'Análise de Vendas' }
      },

      {
        path: 'notifications',
        loadChildren: () =>
          import('./notifications/notifications.module').then(m => m.NotificationsModule),
        canActivate: [AuthGuard],
        data: { title: 'Notificações' }
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
