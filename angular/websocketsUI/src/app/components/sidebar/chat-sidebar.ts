import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sideCarrot.html',
  styleUrls: ['./sideCarrot.scss'],
})
export class ChatSidebarComponent {
  @Input() status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' = 'DISCONNECTED';
  @Input() onlineUsers: number = 0;
  @Input() username: string = 'Guest';
  @Input() userColor: string = 'purple';

  @Output() logout = new EventEmitter<void>();

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.slice(0, 2);
  }

  onLogout() {
    this.logout.emit();
  }
}
