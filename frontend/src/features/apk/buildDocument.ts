import { apkAssets } from './apkAssets.generated';
import type { ApkScreenProps } from './types';

// Escape HTML closing tags when scripts are embedded into one offline document.
const inlineScript = (source: string) => `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>`;

export function buildApkDocument({ entry = 'buyer', page, pageArgs = {} }: ApkScreenProps = {}) {
  const startup = `
    if (${JSON.stringify(entry)} !== 'roles') startMarketDemo(${JSON.stringify(entry)});
    ${page === 'language' ? "go('classicAccount'); chooseLanguage43();" : page ? `go(${JSON.stringify(page)}, ${JSON.stringify(pageArgs)});` : ''}
    document.documentElement.dataset.agentmartReady = 'true';
  `;
  const bridge = `
    if (window.ReactNativeWebView) {
      window.AndroidApp = {
        share: function(title, text) {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'share',title:title,text:text}));
        }
      };
    }
  `;
  return apkAssets['index.html']
    .replace('<link rel="stylesheet" href="styles.css">', `<style>${apkAssets['styles.css']}</style>`)
    .replace('<script src="locales.js"></script>', inlineScript(bridge) + inlineScript(apkAssets['locales.js']))
    .replace('<script src="app.js"></script>', inlineScript(apkAssets['app.js']) + inlineScript(startup));
}
