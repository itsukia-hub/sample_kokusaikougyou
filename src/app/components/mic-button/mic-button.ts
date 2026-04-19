import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-mic-button',
  templateUrl: './mic-button.html',
  styleUrl: './mic-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicButton {
  readonly listening = input(false);
  readonly disabled = input(false);
  readonly toggle = output<void>();

  onClick(): void {
    if (!this.disabled()) {
      this.toggle.emit();
    }
  }
}
