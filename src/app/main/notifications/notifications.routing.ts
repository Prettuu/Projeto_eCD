import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsComponent } from './notifications.component';
import { NotificationFormComponent } from './notification-form.component';
import { AuthGuard } from '../../core/auth.guard';

const routes: Routes = [
  { path: '', component: NotificationsComponent },
  { 
    path: 'create', 
    component: NotificationFormComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMIN', title: 'Criar Notificação' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {}

