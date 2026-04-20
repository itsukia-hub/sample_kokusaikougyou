import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
    title: 'モバイル機能 技術調査サンプル',
  },
  {
    path: 'speech',
    loadComponent: () => import('./pages/speech/speech').then((m) => m.SpeechPage),
    title: '音声入力デモ',
  },
  {
    path: 'camera',
    loadComponent: () => import('./pages/camera/camera').then((m) => m.CameraPage),
    title: 'カメラ起動デモ',
  },
  { path: '**', redirectTo: '' },
];
