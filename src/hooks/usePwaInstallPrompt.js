import { useCallback, useEffect, useMemo, useState } from 'react';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
}

function getPlatformName() {
  if (typeof navigator === 'undefined') {
    return 'tablet';
  }

  const userAgent = String(navigator.userAgent || '').toLowerCase();

  if (userAgent.includes('android')) {
    return 'Android';
  }

  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'iPhone o iPad';
  }

  return 'tu dispositivo';
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneDisplay());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    mediaQuery?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      mediaQuery?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice.catch(() => null);

    if (result?.outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return useMemo(
    () => ({
      isInstalled,
      canPromptInstall: Boolean(deferredPrompt),
      promptInstall,
      platformName: getPlatformName(),
    }),
    [deferredPrompt, isInstalled, promptInstall]
  );
}
