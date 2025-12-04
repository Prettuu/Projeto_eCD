import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClientsComponent } from './clients.component';
import { ClientsFormComponent } from './form/clients-form.component';
import { ClientsRoutingModule } from './clients.routing';

@NgModule({
  declarations: [
    ClientsComponent,
    ClientsFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClientsRoutingModule
  ]
})
export class ClientsModule {}
