'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Download, Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EFilingButtonProps {
  caseFormId: number;
  formCode: string;
  onStart: () => void;
}

export function DemoEFilingButton({
  caseFormId,
  formCode,
  onStart,
}: EFilingButtonProps) {
  const t = useTranslations('dashboard.efiling');
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Detect extension installation via CustomEvent from ezmig-bridge.ts
  useEffect(() => {
    const handleReady = () => setExtensionInstalled(true);

    window.addEventListener('ezmig:extension-ready', handleReady);

    // Ping in case the extension already loaded before this component mounted
    window.dispatchEvent(new CustomEvent('ezmig:ping-extension'));

    return () => {
      window.removeEventListener('ezmig:extension-ready', handleReady);
    };
  }, []);

  const handleSendToExtension = useCallback(async () => {
    setSending(true);

    try {
      // Prepare the payload via our API
      const res = await fetch('/api/e-filing/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseFormId }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('E-Filing prepare failed:', res.status, errorBody);
        throw new Error(`Failed to prepare e-filing data: ${res.status} ${errorBody}`);
      }

      const payload = await res.json();
      payload.apiBaseUrl = window.location.origin;

      // Listen for bridge response (success or error)
      const responsePromise = new Promise<{ error?: string }>((resolve) => {
        const handler = (e: Event) => {
          window.removeEventListener('ezmig:extension-response', handler);
          resolve((e as CustomEvent).detail || {});
        };
        window.addEventListener('ezmig:extension-response', handler);
        // Timeout after 5s in case the bridge never responds
        setTimeout(() => {
          window.removeEventListener('ezmig:extension-response', handler);
          resolve({});
        }, 5000);
      });

      // Send to extension via CustomEvent (picked up by ezmig-bridge.ts)
      window.dispatchEvent(
        new CustomEvent('ezmig:send-to-extension', { detail: payload })
      );

      const bridgeResponse = await responsePromise;
      if (bridgeResponse.error) {
        alert(bridgeResponse.error);
        return;
      }

      setSent(true);
      onStart();

      // Reset sent state after 3s
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('E-Filing prepare failed:', error);
    } finally {
      setSending(false);
    }
  }, [caseFormId, onStart]);

  // Extension not installed: show install prompt
  if (!extensionInstalled) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-gray-300 text-gray-500"
        disabled
        title={t('installExtension')}
      >
        <Download className="h-4 w-4" />
        <span className="ml-1">{t('installExtension')}</span>
      </Button>
    );
  }

  // Extension installed: show send button
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-black text-black hover:bg-gray-100"
      onClick={handleSendToExtension}
      disabled={sending || sent}
    >
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : sent ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
      <span className="ml-1">
        {sending
          ? t('sendingData')
          : sent
            ? t('sentToExtension')
            : t('sendToExtension')}
      </span>
    </Button>
  );
}
