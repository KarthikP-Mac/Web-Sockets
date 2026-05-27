import { Component, signal } from '@angular/core';
import { ChatMainComponent } from './components/chat-main';

@Component({
  selector: 'app-root',
  imports: [ChatMainComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('websocketsUI');
}

