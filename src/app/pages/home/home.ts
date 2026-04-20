import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUILD_INFO } from '../../../environments/version';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly buildInfo = BUILD_INFO;

  get buildTimeDisplay(): string {
    const v = this.buildInfo.builtAt;
    if (!v || v === 'dev') return 'dev';
    try {
      return new Date(v).toLocaleString('ja-JP', { hour12: false });
    } catch {
      return v;
    }
  }
}
