import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { WebView } from 'react-native-webview';
import { createToolsBridge } from './bridge';
import type { ToolsViewProps } from './ToolsView.web';

export default function ToolsView({ html, channel, destination, onError }: ToolsViewProps) {
  const browser = useRef<WebView<object>>(null);
  const bridge = useRef<ReturnType<typeof createToolsBridge> | null>(null);
  const hasHistory = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) browser.current?.injectJavaScript(`window.toolsGo(${JSON.stringify(destination)});true;`);
  }, [destination, ready]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!hasHistory.current) return false;
      browser.current?.injectJavaScript('window.androidBack();true;');
      return true;
    });
    return () => subscription.remove();
  }, []));
  useEffect(() => {
    const instance = createToolsBridge((id, result) => {
      const js = `window.toolsReply(${JSON.stringify(id)},${JSON.stringify(result).replace(/</g, '\\u003c')});true;`;
      browser.current?.injectJavaScript(js);
    }, onError);
    bridge.current = instance;
    return () => { bridge.current = null; instance.dispose(); };
  }, [onError]);
  return <WebView<object> ref={browser} source={{ html }} applicationNameForUserAgent="AgentMart/1.0" style={{ flex: 1, backgroundColor: '#f5f6f7' }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled={false} allowFileAccess={false} mixedContentMode="never" setSupportMultipleWindows={false}
    onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url.startsWith('about:blank#')}
    onError={() => onError('Buyer tools could not load. Leave this screen and try again.')}
    onMessage={event => { try { const message = JSON.parse(event.nativeEvent.data); if (message.channel !== channel) return; if (message.type === 'ready') setReady(true); else if (message.type === 'history') hasHistory.current = Number(message.data?.depth) > 0; else void bridge.current?.receive(message); } catch { /* Ignore malformed messages. */ } }} />;
}
