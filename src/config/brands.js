export const DEFAULT_BRAND = 'zona_b';
export const BRAND_SCOPES = ['zona_b', 'isola', 'common'];
export const BRAND_THEME_TRANSITION = '320ms cubic-bezier(0.22, 1, 0.36, 1)';

export const BRAND_CONFIGS = {
  zona_b: {
    key: 'zona_b',
    mode: 'dark',
    logo: '/zonab.png',
    introLogo: '/logoformalzonab.png',
    switchLogo: '/logoformalzonab.png',
    alt: 'Zona B logo',
    title: 'Menú Zona B',
    subtitle: 'Resto Bar',
    headerReference: 'Resto Bar',
    introCopy: 'Cocteles, parrillas y clásicos de la casa para entrar directo al ambiente Zona B.',
    palette: {
      primary: '#d8ac1e',
      secondary: '#c5a659',
      backgroundDefault: '#060606',
      backgroundPaper: '#151515',
      textPrimary: '#f5f1e6',
      textSecondary: 'rgba(245, 241, 230, 0.72)',
      accent: '#d4af37',
      ink: '#0d0b06',
    },
    titleGradient: 'linear-gradient(90deg,#f7e7b7 0%,#d4af37 50%,#b88a00 100%)',
    appBackground:
      'radial-gradient(circle at 82% 10%, rgba(255,255,255,0.035), transparent 15%), linear-gradient(180deg, #0b0b0b 0%, #070707 42%, #040404 100%)',
    headerBackground:
      'linear-gradient(180deg, rgba(28,28,28,0.72) 0%, rgba(18,18,18,0.52) 100%)',
    headerBorder: 'rgba(255,255,255,0.06)',
    categoryBarBackground:
      'linear-gradient(180deg, rgba(20,20,20,0.74) 0%, rgba(12,12,12,0.58) 100%)',
    frostedPanel:
      'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.035) 100%)',
    cardBackground:
      'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
    searchPromotionBackground:
      'linear-gradient(135deg, rgba(216,172,30,0.16) 0%, rgba(30,26,15,0.96) 14%, rgba(20,20,20,0.98) 58%, rgba(12,12,12,0.98) 100%)',
    dialogBackground:
      'linear-gradient(180deg, rgba(34,34,34,0.98) 0%, rgba(21,21,21,0.98) 100%)',
    sectionGlow: 'rgba(216,172,30,0.08)',
    railGlow: 'rgba(244,205,95,0.12)',
    railEdge: 'rgba(212,175,55,0.24)',
  },
  isola: {
    key: 'isola',
    mode: 'light',
    logo: '/logoisola.png',
    introLogo: '/logoisola.png',
    switchLogo: '/logoisola.png',
    alt: 'ISOLA logo',
    title: 'ISOLA',
    subtitle: 'Trattoria Mobile',
    headerReference: '',
    introCopy: 'Pizzas artesanales al momento, masa ligera y sabor italiano para pedir algo especial esta noche.',
    palette: {
      primary: '#a10d72',
      secondary: '#24384c',
      backgroundDefault: '#f4efe9',
      backgroundPaper: '#fffaf6',
      textPrimary: '#18283c',
      textSecondary: 'rgba(24, 40, 60, 0.72)',
      accent: '#a10d72',
      ink: '#18283c',
    },
    titleGradient: 'linear-gradient(90deg,#7c0c58 0%,#b0107a 52%,#24384c 100%)',
    appBackground:
      'radial-gradient(circle at 88% 8%, rgba(161,13,114,0.1), transparent 20%), radial-gradient(circle at 8% 92%, rgba(36,56,76,0.08), transparent 24%), linear-gradient(180deg, #fbf7f2 0%, #f2ece6 48%, #ebe4db 100%)',
    headerBackground:
      'linear-gradient(180deg, rgba(255,253,250,0.58) 0%, rgba(248,239,232,0.44) 100%)',
    headerBorder: 'rgba(24,40,60,0.1)',
    categoryBarBackground:
      'linear-gradient(180deg, rgba(255,252,248,0.68) 0%, rgba(245,236,229,0.5) 100%)',
    frostedPanel:
      'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,251,247,0.82) 100%)',
    cardBackground:
      'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(252,246,241,0.88) 100%)',
    searchPromotionBackground:
      'linear-gradient(135deg, rgba(161,13,114,0.12) 0%, rgba(255,250,246,0.92) 18%, rgba(248,241,235,0.96) 56%, rgba(236,226,218,0.98) 100%)',
    dialogBackground:
      'linear-gradient(180deg, rgba(255,251,247,0.99) 0%, rgba(247,240,233,0.99) 100%)',
    sectionGlow: 'rgba(161,13,114,0.08)',
    railGlow: 'rgba(161,13,114,0.1)',
    railEdge: 'rgba(161,13,114,0.2)',
  },
};

export function normalizeBrandKey(value, fallback = DEFAULT_BRAND) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z_]/g, '');

  return BRAND_CONFIGS[normalized] ? normalized : fallback;
}

export function normalizeBrandScope(value, fallback = DEFAULT_BRAND) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z_]/g, '');

  return BRAND_SCOPES.includes(normalized) ? normalized : fallback;
}

export function getBrandConfig(brandKey = DEFAULT_BRAND) {
  return BRAND_CONFIGS[normalizeBrandKey(brandKey)];
}

export function getOtherBrand(brandKey = DEFAULT_BRAND) {
  return normalizeBrandKey(brandKey) === 'isola' ? 'zona_b' : 'isola';
}

export function isScopeVisibleForBrand(scope, brandKey = DEFAULT_BRAND) {
  const normalizedScope = normalizeBrandScope(scope, DEFAULT_BRAND);
  const normalizedBrand = normalizeBrandKey(brandKey);

  return normalizedScope === 'common' || normalizedScope === normalizedBrand;
}

export function resolveEffectiveBrandFromScope(scope, fallbackBrand = DEFAULT_BRAND) {
  const normalizedScope = normalizeBrandScope(scope, DEFAULT_BRAND);

  return normalizedScope === 'common' ? normalizeBrandKey(fallbackBrand) : normalizedScope;
}
