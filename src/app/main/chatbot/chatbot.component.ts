import { Component, OnInit } from '@angular/core';
import { ChatbotService, ChatMessage } from './chatbot.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit {
  messages: ChatMessage[] = [];
  currentMessage = '';
  loading = false;
  isOpen = false;

  constructor(
    private chatbotService: ChatbotService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.addBotMessage('Olá! Sou seu assistente virtual. Posso ajudar com recomendações de CDs, informações sobre produtos e muito mais. Como posso ajudar?');
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.loading) return;

    const userMessage: ChatMessage = {
      message: this.currentMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true
    };

    this.messages.push(userMessage);
    const messageToSend = this.currentMessage;
    this.currentMessage = '';
    this.loading = true;

    const clientId = this.auth.getClientId() || this.auth.getUserId();
    const clientIdOrUndefined = clientId ?? undefined;

    this.chatbotService.sendMessage(messageToSend, clientIdOrUndefined).subscribe({
      next: (response) => {
        const botMessage: ChatMessage = {
          message: '',
          response: response.response,
          timestamp: response.timestamp,
          isUser: false
        };
        this.messages.push(botMessage);
        this.loading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Erro no chatbot:', err);
        const errorMessage: ChatMessage = {
          message: '',
          response: 'Desculpe, ocorreu um erro. Tente novamente.',
          timestamp: new Date().toISOString(),
          isUser: false
        };
        this.messages.push(errorMessage);
        this.loading = false;
      }
    });
  }

  private addBotMessage(text: string): void {
    this.messages.push({
      message: '',
      response: text,
      timestamp: new Date().toISOString(),
      isUser: false
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}

