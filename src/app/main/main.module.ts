import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MainComponent } from './main.component';
import { MainRoutingModule } from './main.routing';
import { ChatbotModule } from './chatbot/chatbot.module';

@NgModule({
  declarations: [MainComponent],
  imports: [CommonModule, RouterModule, SharedModule, MainRoutingModule, ChatbotModule],
})
export class MainModule {}
