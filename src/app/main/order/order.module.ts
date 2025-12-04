import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OrderComponent } from './order.component';
import { OrderRoutingModule } from './order.routing';
import { OrderFormComponent } from './form/order-form.component';
import { ExchangeRequestComponent } from './exchange-request/exchange-request.component';
import { ExchangesManagementComponent } from './exchanges-management/exchanges-management.component';

@NgModule({
  declarations: [
    OrderComponent, 
    OrderFormComponent,
    ExchangeRequestComponent,
    ExchangesManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OrderRoutingModule,
    RouterModule,
  ],
})
export class OrderModule {}
