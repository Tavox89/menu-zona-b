function stripDiacritics(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSearchText(value = '') {
  return stripDiacritics(String(value))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getProductSearchMeta(product, categoryMap = new Map()) {
  const categoryNames = (product.menuCategoryIds ?? [])
    .flatMap((id) => {
      const category = categoryMap.get(id);
      return [category?.name ?? '', ...(category?.aliases ?? [])];
    })
    .filter(Boolean);
  const normalizedName = normalizeSearchText(product.name);
  const normalizedCategoryTerms = categoryNames.map(normalizeSearchText);
  const haystack = [normalizedName, ...normalizedCategoryTerms].filter(Boolean).join(' ');

  return {
    categoryNames,
    normalizedName,
    normalizedCategoryTerms,
    haystack,
  };
}

export function matchesProductQuery(product, query, categoryMap = new Map()) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const { haystack } = getProductSearchMeta(product, categoryMap);
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  return tokens.every((token) => haystack.includes(token));
}

export function scoreProductQuery(product, query, categoryMap = new Map()) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const { normalizedName, normalizedCategoryTerms, haystack } = getProductSearchMeta(product, categoryMap);
  if (!haystack) return -1;

  let score = 0;

  if (normalizedName === normalizedQuery) score += 140;
  if (normalizedName.startsWith(normalizedQuery)) score += 90;
  if (normalizedName.includes(normalizedQuery)) score += 55;
  if (normalizedCategoryTerms.some((name) => name === normalizedQuery)) score += 40;
  if (normalizedCategoryTerms.some((name) => name.includes(normalizedQuery))) score += 18;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  tokens.forEach((token) => {
    if (normalizedName.includes(token)) score += 12;
    if (normalizedCategoryTerms.some((name) => name.includes(token))) score += 6;
  });

  return score;
}

export function sortProductsByQuery(products, query, categoryMap = new Map()) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return products;

  return [...products]
    .map((product) => ({
      product,
      score: scoreProductQuery(product, normalizedQuery, categoryMap),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.localeCompare(b.product.name, 'es');
    })
    .map((entry) => entry.product);
}
