import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderComponent } from './order.component';
import { OrderFormComponent } from './form/order-form.component';
import { ExchangeRequestComponent } from './exchange-request/exchange-request.component';
import { ExchangesManagementComponent } from './exchanges-management/exchanges-management.component';

const routes: Routes = [
  { path: '', component: OrderComponent },
  { path: 'new', component: OrderFormComponent },
  { 
    path: 'view/:id', 
    component: OrderFormComponent, 
    data: { viewMode: true } 
  },
  { 
    path: 'edit/:id', 
    component: OrderFormComponent 
  },
  {
    path: 'exchange/:orderId',
    component: ExchangeRequestComponent,
    data: { type: 'exchange' }
  },
  {
    path: 'return/:orderId',
    component: ExchangeRequestComponent,
    data: { type: 'return' }
  },
  {
    path: 'exchanges',
    component: ExchangesManagementComponent,
    data: { title: 'Trocas e Devoluções', role: 'ADMIN' }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrderRoutingModule {}
