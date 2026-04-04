import { useMemo } from 'react';

function detectPlatform() {
  if (typeof navigator === 'undefined') {
    return {
      formFactor: 'desktop',
      formFactorLabel: 'Equipo',
      osLabel: 'Sistema',
      browser: 'other',
      browserLabel: 'Navegador',
      isDesktop: true,
      isTablet: false,
      isPhone: false,
      isAndroid: false,
      isIOS: false,
    };
  }

  const userAgent = String(navigator.userAgent || '').toLowerCase();
  const platform = String(navigator.platform || '').toLowerCase();
  const touchPoints = Number(navigator.maxTouchPoints || 0);

  const isIPad = userAgent.includes('ipad') || (platform.includes('mac') && touchPoints > 1);
  const isIPhone = userAgent.includes('iphone');
  const isAndroid = userAgent.includes('android');
  const isTablet =
    isIPad ||
    userAgent.includes('tablet') ||
    (isAndroid && !userAgent.includes('mobile'));
  const isPhone = isIPhone || (isAndroid && userAgent.includes('mobile'));
  const isDesktop = !isTablet && !isPhone;

  let browser = 'other';
  let browserLabel = 'Navegador';

  if (userAgent.includes('edg/')) {
    browser = 'edge';
    browserLabel = 'Microsoft Edge';
  } else if (userAgent.includes('samsungbrowser/')) {
    browser = 'samsung';
    browserLabel = 'Samsung Internet';
  } else if (userAgent.includes('chrome/') || userAgent.includes('crios/')) {
    browser = 'chrome';
    browserLabel = 'Google Chrome';
  } else if (userAgent.includes('safari/') && !userAgent.includes('chrome/') && !userAgent.includes('crios/')) {
    browser = 'safari';
    browserLabel = 'Safari';
  } else if (userAgent.includes('firefox/') || userAgent.includes('fxios/')) {
    browser = 'firefox';
    browserLabel = 'Firefox';
  }

  let osLabel = 'Sistema';

  if (isAndroid) {
    osLabel = 'Android';
  } else if (isIPad || isIPhone) {
    osLabel = 'iPhone o iPad';
  } else if (platform.includes('win')) {
    osLabel = 'Windows';
  } else if (platform.includes('mac')) {
    osLabel = 'macOS';
  } else if (platform.includes('linux')) {
    osLabel = 'Linux';
  }

  return {
    formFactor: isTablet ? 'tablet' : isPhone ? 'phone' : 'desktop',
    formFactorLabel: isTablet ? 'Tablet' : isPhone ? 'Teléfono' : 'PC',
    osLabel,
    browser,
    browserLabel,
    isDesktop,
    isTablet,
    isPhone,
    isAndroid,
    isIOS: isIPad || isIPhone,
  };
}

export function useClientPlatformInfo() {
  return useMemo(() => detectPlatform(), []);
}
