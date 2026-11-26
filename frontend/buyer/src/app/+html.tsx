import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Root HTML for web. The viewport is locked so the page doesn't zoom or rescale on phones.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'html,body{-webkit-text-size-adjust:100%;text-size-adjust:100%;touch-action:manipulation;overscroll-behavior:none}input,select,textarea{font-size:16px}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
