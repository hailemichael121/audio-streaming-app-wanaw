'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, Share2 } from 'lucide-react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isHidden || isStandalone) return null;
  if (!installEvent && !isIos) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-[80] mx-auto max-w-md rounded-2xl border border-white/20 bg-card/90 p-3 shadow-xl backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Install mezgebe sbhat</p>
          {installEvent ? (
            <p className="text-xs text-muted-foreground">Add to home screen for app-like experience.</p>
          ) : (
            <p className="text-xs text-muted-foreground">On iPhone tap <Share2 className="mx-0.5 inline h-3 w-3" /> and Add to Home Screen.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {installEvent && (
            <button
              className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              onClick={async () => {
                await installEvent.prompt();
                await installEvent.userChoice;
                setIsHidden(true);
              }}
            >
              <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Install</span>
            </button>
          )}
          <button className="text-xs text-muted-foreground" onClick={() => setIsHidden(true)}>Later</button>
        </div>
      </div>
    </div>
  );
}
