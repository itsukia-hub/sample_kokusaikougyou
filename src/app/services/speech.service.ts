import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

declare const webkitSpeechRecognition: any;

export type SpeechState = 'idle' | 'listening' | 'error';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private recognition: any = null;
  private shouldRestart = false;

  readonly finalResult$ = new Subject<string>();
  readonly interimResult$ = new Subject<string>();
  readonly state$ = new BehaviorSubject<SpeechState>('idle');
  readonly error$ = new Subject<string>();

  get isSupported(): boolean {
    const w = window as any;
    return typeof w.webkitSpeechRecognition !== 'undefined' || typeof w.SpeechRecognition !== 'undefined';
  }

  get isIOS(): boolean {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (/Mac/.test(ua) && 'ontouchend' in document);
  }

  start(): void {
    if (!this.isSupported) {
      this.state$.next('error');
      this.error$.next('お使いのブラウザはこの機能に対応していません (Chrome または Safari をお使いください)');
      return;
    }
    if (this.state$.value === 'listening') {
      return;
    }

    // 全OS共通で「1発話→onend→自動再起動」ループに統一する。
    // Android Chrome の continuous:true モードでは、同一 resultIndex に対して
    // 「前の final を含んだ、より長い final」が再発火して結果が重複する既知の挙動があるため。
    this.shouldRestart = true;
    this.initRecognition();
    try {
      this.recognition.start();
      this.state$.next('listening');
    } catch (e) {
      this.state$.next('error');
      this.error$.next('音声認識の開始に失敗しました');
    }
  }

  stop(): void {
    this.shouldRestart = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.state$.next('idle');
  }

  private initRecognition(): void {
    const w = window as any;
    const Ctor = w.webkitSpeechRecognition || w.SpeechRecognition;
    const rec = new Ctor();
    rec.lang = 'ja-JP';
    rec.interimResults = true;
    // continuous:false で 1発話ごとに完結させ、onend で即再起動する。
    // これにより Android Chrome の continuous モード起因の重複バグを回避する。
    rec.continuous = false;

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          this.finalResult$.next(text);
        } else {
          this.interimResult$.next(text);
        }
      }
    };

    rec.onerror = (event: any) => {
      const code = event.error;
      if (code === 'no-speech' || code === 'aborted') {
        return;
      }
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        this.error$.next('マイクの使用許可が必要です。ブラウザの設定を確認してください');
        this.state$.next('error');
        this.shouldRestart = false;
        return;
      }
      this.error$.next(`音声認識エラー: ${code}`);
      this.state$.next('error');
      this.shouldRestart = false;
    };

    rec.onend = () => {
      if (this.shouldRestart && this.state$.value === 'listening') {
        try {
          rec.start();
        } catch {
          // already started
        }
      } else {
        if (this.state$.value !== 'error') {
          this.state$.next('idle');
        }
      }
    };

    this.recognition = rec;
  }
}
