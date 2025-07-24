export function calcLine(item) {
  const extrasTotal = (item.extras ?? []).reduce(
    (t, e) => t + Number(e.price || 0),
    0
  );
  return (Number(item.basePrice ?? 0) + extrasTotal) * (item.qty || 0);
}

export function calcSubtotal(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((t, it) => t + calcLine(it), 0);
}