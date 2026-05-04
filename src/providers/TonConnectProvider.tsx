import { TonConnectUIProvider } from '@tonconnect/ui-react';

const MANIFEST_URL = import.meta.env.VITE_TONCONNECT_MANIFEST_URL || 'https://phive-five.vercel.app/tonconnect-manifest.json';

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      {children}
    </TonConnectUIProvider>
  );
}
