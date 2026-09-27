// Expo（React Native）アプリ。Expo の導入と4タブの画面は E00-S04 で行う。
import { packageName as corePackageName } from '@payment-app/core';

export const packageName = '@payment-app/mobile';

export const dependsOn = [corePackageName] as const;
