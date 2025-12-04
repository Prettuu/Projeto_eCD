import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdmComponent } from './adm.component';
import { RoleGuard } from '../../shared/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdmComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdmRoutingModule {}
