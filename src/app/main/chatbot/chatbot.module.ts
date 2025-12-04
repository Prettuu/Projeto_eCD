import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotComponent } from './chatbot.component';

@NgModule({
  declarations: [ChatbotComponent],
  imports: [CommonModule, FormsModule],
  exports: [ChatbotComponent]
})
export class ChatbotModule { }

