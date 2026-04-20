import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUILD_INFO } from '../../../environments/version';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

@Component({
  selector: 'app-camera-page',
  imports: [RouterLink],
  templateUrl: './camera.html',
  styleUrl: './camera.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraPage {
  private readonly destroyRef = inject(DestroyRef);

  readonly fileInfo = signal<FileInfo | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly deviceInfo = this.detectDevice();
  readonly isMobile = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
  readonly buildInfo = BUILD_INFO;

  constructor() {
    this.destroyRef.onDestroy(() => {
      const url = this.previewUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const oldUrl = this.previewUrl();
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    this.previewUrl.set(URL.createObjectURL(file));
    this.fileInfo.set({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
    this.errorMessage.set('');

    // 同じファイルを再選択しても change が発火するよう value をクリア
    input.value = '';
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  formatDate(ms: number): string {
    try {
      return new Date(ms).toLocaleString('ja-JP', { hour12: false });
    } catch {
      return String(ms);
    }
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
