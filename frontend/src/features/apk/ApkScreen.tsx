import { useEffect, useMemo, useRef } from 'react';
import { BackHandler, Linking, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { buildApkDocument } from './buildDocument';
import type { ApkScreenProps } from './types';

/** The APK itself is a WebView app; preserve its original document on both OSes. */
export default function ApkScreen({ entry = 'buyer', page, pageArgs }: ApkScreenProps) {
  const webView = useRef<WebView<object>>(null);
  const argsKey = JSON.stringify(pageArgs ?? {});
  const source = useMemo(() => ({
    html: buildApkDocument({ entry, page, pageArgs: JSON.parse(argsKey) }),
    baseUrl: 'https://agentmart.local/',
  }), [entry, page, argsKey]);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      webView.current?.injectJavaScript(`
        if (window.androidBack && !window.androidBack()) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'exit'}));
        }
        true;
      `);
      return true;
    });
    return () => back.remove();
  }, []);

  return <SafeAreaView style={styles.container}>
    <WebView<object> ref={webView} source={source} style={styles.container}
      originWhitelist={['*']} javaScriptEnabled domStorageEnabled
      javaScriptCanOpenWindowsAutomatically={false}
      geolocationEnabled setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={request => {
        if (request.url === 'about:blank' || request.url.startsWith('https://agentmart.local/')) return true;
        if (/^(https?:|mailto:|tel:|geo:)/i.test(request.url)) {
          void Linking.openURL(request.url).catch(() => {});
        }
        return false;
      }}
      onMessage={event => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'share' && typeof message.text === 'string') {
            void Share.share({ title: String(message.title ?? 'Agent Mart'), message: message.text }).catch(() => {});
          } else if (message.type === 'exit') BackHandler.exitApp();
        } catch { /* Ignore malformed messages from the embedded document. */ }
      }}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f3f3f9' } });
