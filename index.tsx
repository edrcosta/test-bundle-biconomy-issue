// sort-imports-ignore
import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import App from './app/App'

if (process.env.NODE_ENV !== 'development') {
  // @ts-ignore ignore this so we don't have to generate before doing a type check
  import('./tamagui-web.css');
}

registerRootComponent(App);
