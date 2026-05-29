import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// SockJS and Stomp are loaded as browser globals via CDN scripts in index.html
declare const SockJS: any;
declare const Stomp: any;

@Injectable({ providedIn: 'root' })
export class WsService {
  private isBrowser: boolean;
  stompClient: any;
  status = signal<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  private savedCallbacks: any;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  connect(callbacks: any) {
    if (!this.isBrowser) return;
    this.savedCallbacks = callbacks;
    this.status.set('CONNECTING');

    try {
      const backendUrl = this.resolveBackendUrl();
      const socket = new SockJS(`${backendUrl}/ws`);
      this.stompClient = Stomp.over(socket);
      this.stompClient.debug = () => { }; // Suppress console noise

      this.stompClient.connect({},
        () => {
          this.status.set('CONNECTED');

          this.stompClient.subscribe('/topic/messages', (m: any) => {
            try { this.savedCallbacks.message(JSON.parse(m.body)); }
            catch (e) { console.error('Error parsing message body', e); }
          });

          this.stompClient.subscribe('/topic/users', (m: any) => {
            try { this.savedCallbacks.users(parseInt(m.body, 10) || 0); }
            catch (e) { console.error('Error parsing user count', e); }
          });

          this.stompClient.subscribe('/topic/typing', (m: any) => {
            try { this.savedCallbacks.typing(JSON.parse(m.body)); }
            catch (e) { console.error('Error parsing typing body', e); }
          });

          this.stompClient.subscribe('/topic/reactions', (m: any) => {
            try { this.savedCallbacks.reaction(JSON.parse(m.body)); }
            catch (e) { console.error('Error parsing reaction body', e); }
          });
        },
        (error: any) => {
          console.error('STOMP connection error:', error);
          this.status.set('DISCONNECTED');
          setTimeout(() => this.connect(this.savedCallbacks), 5000);
        }
      );
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.status.set('DISCONNECTED');
      setTimeout(() => this.connect(this.savedCallbacks), 5000);
    }
  }

  sendMessage(msg: any) {
    if (this.stompClient && this.status() === 'CONNECTED') {
      this.stompClient.send('/app/chat', {}, JSON.stringify(msg));
    }
  }

  typing(msg: any) {
    if (this.stompClient && this.status() === 'CONNECTED') {
      this.stompClient.send('/app/typing', {}, JSON.stringify(msg));
    }
  }

  react(msg: any) {
    if (this.stompClient && this.status() === 'CONNECTED') {
      this.stompClient.send('/app/reaction', {}, JSON.stringify(msg));
    }
  }

  refreshActiveConnections() {
    if (this.stompClient && this.status() === 'CONNECTED') {
      this.stompClient.send('/app/users/refresh', {}, {});
    }
  }

  private resolveBackendUrl(): string {
    if (!this.isBrowser) return 'http://localhost:8080';

    const hostname = window.location.hostname;

    // Production Deployment (Single Container)
    // If we are not on localhost or a dev tunnel, we are in production.
    // The Spring Boot backend is serving the UI, so they share the exact same host.
    // Returning an empty string makes SockJS connect relatively (e.g. /ws)
    if (!hostname.includes('localhost') && !hostname.includes('.devtunnels.ms')) {
      return '';
    }

    // VS Code Dev Tunnel: e.g. d9kvszsx-4200.inc1.devtunnels.ms
    // Replace the UI port segment with the backend port 8080
    if (hostname.endsWith('.devtunnels.ms')) {
      const backendHost = hostname.replace(/-(\d+)\./, '-8080.');
      return `https://${backendHost}`;
    }

    // Local development
    return 'http://localhost:8080';
  }
}
