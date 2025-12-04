import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { StockRoutingModule } from './stock.routing';
import { StockComponent } from './stock.component';
import { StockFormComponent } from './form/stock-form.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [
    StockComponent,
    StockFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    StockRoutingModule,
    SharedModule
  ]
})
export class StockModule { }
