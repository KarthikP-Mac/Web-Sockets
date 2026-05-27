import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMOJI_LIST } from './emojis';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatInput.html',
  styleUrls: ['./chatInput.scss'],
})
export class ChatInputComponent implements OnDestroy {
  @Input() typingUser = '';
  @Input() currentUser = '';

  @Output() sendMessage = new EventEmitter<string>();
  @Output() typing = new EventEmitter<void>();

  messageText = '';
  showEmojiPicker = false;
  readonly emojis = EMOJI_LIST;
  private lastTypingTime = 0;
  private removeDocumentClickListener?: () => void;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
    this.removeDocumentClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      this.onDocumentClick(event);
    });
  }

  onInput() {
    const now = Date.now();
    // Throttle typing events: only send once every 2 seconds
    if (now - this.lastTypingTime > 2000) {
      this.typing.emit();
      this.lastTypingTime = now;
    }
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.messageText += emoji;
    this.showEmojiPicker = false;
    this.onInput();
  }

  private onDocumentClick(event: MouseEvent) {
    const hostElement = this.elementRef.nativeElement as HTMLElement;
    if (!hostElement.contains(event.target as Node) && this.showEmojiPicker) {
      this.showEmojiPicker = false;
    }
  }

  ngOnDestroy() {
    if (this.removeDocumentClickListener) {
      this.removeDocumentClickListener();
      this.removeDocumentClickListener = undefined;
    }
  }

  onSubmit() {
    if (this.messageText.trim()) {
      this.sendMessage.emit(this.messageText.trim());
      this.messageText = '';
    }
  }
}
