import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ModalType = 'delete' | 'cancel' | 'info' | 'warning';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() title!: string;
  @Input() type!: ModalType;
  @Input() confirmButtonText?: string;
  @Input() cancelButtonText?: string;

  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  isOpen: boolean = false;

  openModal(): void {
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  confirmModal(): void {
    this.confirm.emit();
    this.closeModal();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  get finalTitle(): string {
    if (this.title) return this.title;
    switch (this.type) {
      case 'delete': return 'Confirmação de exclusão';
      case 'cancel': return 'Confirmação';
      case 'info': return 'Informação';
      case 'warning': return 'Atenção';
    }
  }

  get finalConfirmText(): string {
    return this.confirmButtonText || 'Sim';
  }

  get finalCancelText(): string {
    return this.cancelButtonText || 'Não';
  }

  get showAlert(): boolean {
    return this.type === 'delete' || this.type === 'cancel' || this.type === 'warning';
  }

  get alertMessage(): string {
    switch (this.type) {
      case 'delete': return 'Esta ação é irreversível!';
      case 'cancel': return 'Deseja realmente cancelar?';
      case 'warning': return 'Atenção! Verifique os dados antes de continuar.';
      default: return '';
    }
  }

  get confirmButtonClass(): string {
    switch (this.type) {
      case 'delete': return 'btn-red';
      case 'cancel': return 'btn-blue';
      case 'warning': return 'btn-orange';
      default: return 'btn-gray';
    }
  }

  get cancelButtonClass(): string {
    return 'btn-gray';
  }
}
