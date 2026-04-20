import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SpeechService, SpeechState } from '../../services/speech.service';
import { MicButton } from '../../components/mic-button/mic-button';
import { BUILD_INFO } from '../../../environments/version';

@Component({
  selector: 'app-speech-page',
  imports: [FormsModule, MicButton],
  templateUrl: './speech.html',
  styleUrl: './speech.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeechPage {
  private readonly speech = inject(SpeechService);
  private readonly destroyRef = inject(DestroyRef);

  readonly textValue = signal('');
  readonly interimText = signal('');
  readonly state = signal<SpeechState>('idle');
  readonly errorMessage = signal('');
  readonly supported = this.speech.isSupported;
  readonly deviceInfo = this.detectDevice();
  readonly buildInfo = BUILD_INFO;

  constructor() {
    this.speech.finalResult$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((text) => {
      this.textValue.update((current) => current + text);
      this.interimText.set('');
    });

    this.speech.interimResult$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((text) => {
      this.interimText.set(text);
    });

    this.speech.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.state.set(state);
      if (state === 'idle') {
        this.interimText.set('');
      }
    });

    this.speech.error$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((msg) => {
      this.errorMessage.set(msg);
    });
  }

  toggleListening(): void {
    if (this.state() === 'listening') {
      this.speech.stop();
    } else {
      this.errorMessage.set('');
      this.speech.start();
    }
  }

  onTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.textValue.set(target.value);
  }

  get statusText(): string {
    if (this.errorMessage()) return `エラー: ${this.errorMessage()}`;
    if (this.state() === 'listening') {
      return this.interimText() ? `認識中: ${this.interimText()}` : '聞いています...';
    }
    return '待機中';
  }

  get statusIsError(): boolean {
    return !!this.errorMessage();
  }

  get buildTimeDisplay(): string {
    const v = this.buildInfo.builtAt;
    if (!v || v === 'dev') return 'dev';
    try {
      return new Date(v).toLocaleString('ja-JP', { hour12: false });
    } catch {
      return v;
    }
  }

  private detectDevice(): string {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Mac/.test(ua)) os = 'macOS';
    else if (/Win/.test(ua)) os = 'Windows';

    let browser = 'Unknown';
    if (/EdgA?/.test(ua)) browser = 'Edge';
    else if (/CriOS/.test(ua)) browser = 'Chrome (iOS)';
    else if (/Chrome/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';

    return `${os} / ${browser}`;
  }
}
