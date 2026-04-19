# モバイル音声入力デモ (Angular)

国際航業様案件向け、モバイル音声入力フィージビリティ確認用のデモ。
Web Speech API (`webkitSpeechRecognition`) を Angular 21 で抽象化した参考実装。

## 技術スタック
- Angular 21 (standalone components)
- TypeScript (strict)
- RxJS (Subject / BehaviorSubject で認識結果を配信)
- スタイルは pure CSS

## 構成
```
src/
  app/
    app.ts / app.html / app.css        // ルート画面
    services/
      speech.service.ts                // Web Speech API 抽象化
    components/
      mic-button/
        mic-button.ts / .html / .css   // マイクアイコンボタン
```

## SpeechService の設計メモ

### 重複バグ防止
`onresult` では必ず `event.resultIndex` 以降の新規分だけ処理する:

```ts
rec.onresult = (event: any) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) {
      this.finalResult$.next(result[0].transcript);
    } else {
      this.interimResult$.next(result[0].transcript);
    }
  }
};
```

- `finalResult$` は確定結果のみ → テキストエリアに追記
- `interimResult$` は中間結果のみ → ステータス欄に「認識中: ...」と一時表示
- これを守らないと「明日天気になれ」が「明日明日天気になれ」のように中間と最終の両方が連結される

### iOS / Android 差異吸収
- iOS Safari: `continuous = false` + `onend` で自動再起動ループ（1発話制限を吸収）
- Android Chrome / PC Chrome: `continuous = true`
- 両方とも `interimResults = true`

## ローカル開発
```bash
npm install
npm start  # http://localhost:4200
```

## ビルド
```bash
npm run build
# 成果物: dist/speech-demo/browser/
```

## Netlify デプロイ
- `netlify.toml` に設定済
  - Build command: `npm run build`
  - Publish directory: `dist/speech-demo/browser`
- GitHub連携でpushごとに自動デプロイ

## 動作確認チェックリスト
- [ ] PC Chrome / Edge でマイクボタン動作
- [ ] iOS Safari (iOS 16+) で動作
- [ ] Android Chrome (最新) で動作
- [ ] マイク権限拒否時のエラー表示
- [ ] 非対応ブラウザでの表示
- [ ] 無音時の挙動 (iOS は自動再起動が働くこと)
- [ ] 「明日天気になれ」が 1回だけ入力されること (重複バグ回帰確認)

## 本番移植時の注意
- 本プロジェクトは PoC 用。国際航業様の本番 Angular プロジェクトに移植する際は、`SpeechService` と `MicButton` を対象プロジェクトの既存アーキテクチャ（Reactive Forms / ControlValueAccessor 等）に合わせて調整する。
