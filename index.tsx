// sort-imports-ignore
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

if (process.env.NODE_ENV !== 'development') {
  // @ts-ignore ignore this so we don't have to generate before doing a type check
  import('./tamagui-web.css');
}

renderRootComponent(App);
