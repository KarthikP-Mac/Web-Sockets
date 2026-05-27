import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loginPage.html',
  styleUrls: ['./loginPage.scss'],
})
export class ChatLoginComponent {
  username = '';

  colors = [
    { name: 'purple', value: 'linear-gradient(135deg, #a855f7, #7e22ce)' },
    { name: 'blue', value: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { name: 'emerald', value: 'linear-gradient(135deg, #10b981, #047857)' },
    { name: 'pink', value: 'linear-gradient(135deg, #ec4899, #be185d)' },
    { name: 'orange', value: 'linear-gradient(135deg, #f97316, #c2410c)' },
    { name: 'cyan', value: 'linear-gradient(135deg, #06b6d4, #0891b2)' }
  ];

  selectedColor = signal('purple');

  @Output() login = new EventEmitter<{ username: string; color: string }>();

  onSubmit() {
    if (this.username.trim()) {
      this.login.emit({
        username: this.username.trim(),
        color: this.selectedColor()
      });
    }
  }
}
