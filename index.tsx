// sort-imports-ignore
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import App from './app/App'

if (process.env.NODE_ENV !== 'development') {
  // @ts-ignore ignore this so we don't have to generate before doing a type check
  import('./tamagui-web.css');
}

registerRootComponent(App);
