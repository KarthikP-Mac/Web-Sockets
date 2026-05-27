import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChatMessage {
  type: 'CHAT' | 'SYSTEM' | 'REACTION' | 'TYPING';
  sender: string;
  content: string;
  emoji?: string;
  timestamp?: Date;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of usernames
}

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatMessages.html',
  styleUrls: ['./chatMessages.scss'],
})
export class ChatMessagesComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() currentUser: string = '';
  @Input() currentUserColor: string = 'purple';

  @Output() react = new EventEmitter<{ emoji: string; message: ChatMessage }>();

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private shouldScrollToBottom = true;
  quickEmojis = ['👍', '😂', '❤️', '🔥', '🎉'];

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  onScroll() {
    const el = this.scrollContainer.nativeElement;
    // Check if user is near bottom (within 150px)
    const threshold = 150;
    this.shouldScrollToBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) < threshold;
  }

  private scrollToBottom(): void {
    if (!this.shouldScrollToBottom) return;
    try {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (err) {}
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    return name.slice(0, 2);
  }

  getAvatarColorClass(sender: string): string {
    if (!sender) return 'purple';
    const colors = ['purple', 'blue', 'emerald', 'pink', 'orange', 'cyan'];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
      hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  onReact(emoji: string, message: ChatMessage) {
    this.react.emit({ emoji, message });
  }

  hasReactions(message: ChatMessage): boolean {
    return !!message.reactions && Object.keys(message.reactions).length > 0;
  }

  getReactionsArray(message: ChatMessage): { emoji: string; users: string[] }[] {
    if (!message.reactions) return [];
    return Object.entries(message.reactions).map(([emoji, users]) => ({
      emoji,
      users
    }));
  }

  hasUserReacted(users: string[]): boolean {
    return users.includes(this.currentUser);
  }
}
