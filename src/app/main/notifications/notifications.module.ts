import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationsComponent } from './notifications.component';
import { NotificationFormComponent } from './notification-form.component';
import { NotificationsRoutingModule } from './notifications.routing';

@NgModule({
  declarations: [
    NotificationsComponent,
    NotificationFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NotificationsRoutingModule
  ]
})
export class NotificationsModule {}

