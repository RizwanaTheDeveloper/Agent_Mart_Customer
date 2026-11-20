import { createElement, useMemo } from 'react';
import { View } from 'react-native';
import { buildApkDocument } from './buildDocument';
import type { ApkScreenProps } from './types';

export default function ApkScreen({ entry = 'buyer', page, pageArgs }: ApkScreenProps) {
  const argsKey = JSON.stringify(pageArgs ?? {});
  const html = useMemo(() => buildApkDocument({ entry, page, pageArgs: JSON.parse(argsKey) }), [entry, page, argsKey]);
  return <View style={{ flex: 1, backgroundColor: '#f3f3f9' }}>
    {createElement('iframe', {
      title: 'Agent Mart Property Workspace',
      srcDoc: html,
      allow: 'geolocation; clipboard-write; web-share',
      // Same-origin storage keeps the APK's existing offline save flows working.
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox',
      style: { width: '100%', height: '100%', flex: 1, border: 0, display: 'block' },
    })}
  </View>;
}
