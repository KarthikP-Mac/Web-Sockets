import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WsService } from '../ws.service';
import { ChatLoginComponent } from './login/chat-login';
import { ChatSidebarComponent } from './sidebar/chat-sidebar';
import { ChatMessagesComponent, ChatMessage } from './messages/chat-messages';
import { ChatInputComponent } from './inputChat/chat-input';

@Component({
  selector: 'app-chat-main',
  standalone: true,
  imports: [
    CommonModule,
    ChatLoginComponent,
    ChatSidebarComponent,
    ChatMessagesComponent,
    ChatInputComponent
  ],
  template: `
    <div class="main-layout" *ngIf="loggedIn(); else loginScreen">
      <!-- Sidebar -->
      <div class="sidebar-overlay" *ngIf="isSidebarOpen()" (click)="toggleSidebar()"></div>
      <app-chat-sidebar
        [class.open]="isSidebarOpen()"
        [status]="wsStatus()"
        [onlineUsers]="onlineUsers()"
        [username]="username()"
        [userColor]="userColor()"
        (logout)="onLogout()"
      ></app-chat-sidebar>

      <!-- Chat Workspace -->
      <div class="chat-workspace">
        <div class="workspace-header">
          <button class="sidebar-toggle" (click)="toggleSidebar()">
            {{ isSidebarOpen() ? '✕' : '☰' }}
          </button>
          <h3>LiveWave</h3>
        </div>

        <!-- Messages Log -->
        <app-chat-messages class="messages-container"
          [messages]="messages()"
          [currentUser]="username()"
          [currentUserColor]="userColor()"  
          (react)="onReact($event)"
        ></app-chat-messages>

        <!-- Message Input bar -->
        <app-chat-input
          [typingUser]="typingUser()"
          [currentUser]="username()"
          (sendMessage)="onSendMessage($event)"
          (typing)="onTyping()"
        ></app-chat-input>
      </div>
    </div>

    <!-- Login Dialog overlay -->
    <ng-template #loginScreen>
      <app-chat-login (login)="onLogin($event)"></app-chat-login>
    </ng-template>
  `,
  styles: [`
    .main-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: #121214;
      color: #e3e3e6;
      font-family: 'Inter', sans-serif;
      position: relative;
    }

    .chat-workspace {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      height: 100%;
      position: relative;
      width: 100%;
    }

    .workspace-header {
      display: none;
      align-items: center;
      padding: 12px 16px;
      background: #18181c;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      gap: 12px;
      z-index: 102;
    }

    .workspace-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .sidebar-toggle {
      background: transparent;
      border: none;
      color: #e3e3e6;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 4px;
    }

    .messages-container {
      flex-grow: 1;
      overflow-y: scroll;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 768px) {
      .workspace-header {
        display: flex;
      }
      .sidebar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99;
        backdrop-filter: blur(2px);
      }
      app-chat-sidebar {
        position: absolute;
        z-index: 100;
        height: 100%;
        left: 0;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
      }
      app-chat-sidebar.open {
        transform: translateX(0);
      }
    }

    @media (min-width: 769px) {
      .sidebar-overlay {
        display: none;
      }
    }
  `]
})
export class ChatMainComponent implements OnInit, OnDestroy {
  loggedIn = signal(false);
  username = signal('Guest');
  userColor = signal('purple');

  onlineUsers = signal(0);
  messages = signal<ChatMessage[]>([]);
  typingUser = signal('');
  isSidebarOpen = signal(false);

  get wsStatus() {
    return this.ws.status;
  }
  private typingTimeout: any;

  constructor(private ws: WsService) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.isSidebarOpen.set(window.innerWidth > 768);
    }
    // Check if session storage already has active user info
    if (typeof sessionStorage !== 'undefined') {
      const savedName = sessionStorage.getItem('chat_username');
      const savedColor = sessionStorage.getItem('chat_color');

      if (savedName && savedColor) {
        this.username.set(savedName);
        this.userColor.set(savedColor);
        this.loggedIn.set(true);
        this.initializeWebSocket();
      }
    }
  }

  ngOnDestroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  onLogin(userData: { username: string; color: string }) {
    this.username.set(userData.username);
    this.userColor.set(userData.color);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('chat_username', userData.username);
      sessionStorage.setItem('chat_color', userData.color);
    }
    this.loggedIn.set(true);

    this.initializeWebSocket();
  }

  onLogout() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('chat_username');
      sessionStorage.removeItem('chat_color');
    }
    this.loggedIn.set(false);
    // Refresh to disconnect cleanly
    window.location.reload();
  }

  private initializeWebSocket() {
    this.ws.connect({
      message: (m: ChatMessage) => this.handleIncomingMessage(m),
      users: (count: number) => this.onlineUsers.set(count),
      typing: (t: ChatMessage) => this.handleTyping(t),
      reaction: (r: ChatMessage) => this.handleReaction(r)
    });
  }

  private handleIncomingMessage(m: ChatMessage) {
    // Assign standard timestamp
    const msg: ChatMessage = {
      ...m,
      timestamp: new Date()
    };
    this.messages.update(prev => [...prev, msg]);
  }

  private handleTyping(t: ChatMessage) {
    if (t.sender === this.username()) return; // Don't show typing for self

    this.typingUser.set(t.sender);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.typingUser.set('');
    }, 3000);
  }

  private handleReaction(r: ChatMessage) {
    const list = this.messages();
    // Reactions are targeted via the message content as per user logic
    const target = list.find(m => m.type === 'CHAT' && m.content === r.content);

    if (target) {
      if (!target.reactions) {
        target.reactions = {};
      }
      if (!target.reactions[r.emoji!]) {
        target.reactions[r.emoji!] = [];
      }

      const userIndex = target.reactions[r.emoji!].indexOf(r.sender);
      if (userIndex > -1) {
        // Toggle reaction off
        target.reactions[r.emoji!].splice(userIndex, 1);
        if (target.reactions[r.emoji!].length === 0) {
          delete target.reactions[r.emoji!];
        }
      } else {
        // Add reaction
        target.reactions[r.emoji!].push(r.sender);
      }

      this.messages.set([...list]);
    }
  }

  onSendMessage(content: string) {
    this.ws.sendMessage({
      type: 'CHAT',
      sender: this.username(),
      content: content
    });
  }

  onTyping() {
    this.ws.typing({
      type: 'TYPING',
      sender: this.username()
    });
  }

  onReact(event: { emoji: string; message: ChatMessage }) {
    this.ws.react({
      type: 'REACTION',
      sender: this.username(),
      emoji: event.emoji,
      content: event.message.content
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }
}
