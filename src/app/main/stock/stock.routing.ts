import { Routes, RouterModule } from '@angular/router';
import { StockComponent } from './stock.component';
import { StockFormComponent } from './form/stock-form.component';

const routes: Routes = [
  { path: '', component: StockComponent },
  { path: 'form', component: StockFormComponent },
  { path: 'form/:id', component: StockFormComponent },
];

export const StockRoutingModule = RouterModule.forChild(routes);
