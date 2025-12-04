import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients.component';
import { ClientsFormComponent } from './form/clients-form.component';

const routes: Routes = [
  { path: '', component: ClientsComponent },
  { path: 'create', component: ClientsFormComponent },
  { path: 'edit/:id', component: ClientsFormComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}
