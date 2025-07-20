/**
 * Parse the Tavox extras definition from WooCommerce meta_data.
 *
 * Our custom plugin stores extras in the `_tavox_groups` meta key. Each
 * group defines a set of options (radio or checkbox) along with a
 * `multiple` flag and an optional group title. Items within a group
 * specify a `label`, `price` and may contain ingredient instructions, but
 * for the UI we only need the label and price. The parser normalizes
 * these structures into a format that the front‑end can consume easily.
 *
 * @param {Array<{key:string,value:any}>} metaData Array of meta objects
 * @returns {Array<{
 *   groupId: string;
 *   label: string;
 *   multiple: boolean;
 *   options: Array<{ id: string; label: string; price: number }>;
 * }>} Parsed extras
 */
export function parseExtras(metaData) {
  if (!Array.isArray(metaData)) return [];
  // Find the entry where the plugin stores extras. Woo stores meta values
  // as plain values (arrays) but sometimes themes serialize them as JSON
  // strings; support both.
  const entry = metaData.find((m) => m.key === '_tavox_groups');
  if (!entry || entry.value == null) return [];
  let rawGroups = entry.value;
  if (typeof rawGroups === 'string') {
    try {
      rawGroups = JSON.parse(rawGroups);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rawGroups)) return [];
  return rawGroups.map((group, groupIndex) => {
    const groupLabel = group.show_title
      ? group.group_title || 'Extras'
      : '';
    const multiple = Boolean(group.multiple);
    const options = Array.isArray(group.items)
      ? group.items
          .filter((item) => item && item.label)
          .map((item, itemIndex) => ({
            id: `${groupIndex}-${itemIndex}`,
            label: item.label,
            price: Number(item.price) || 0,
          }))
      : [];
    return {
      groupId: `group-${groupIndex}`,
      label: groupLabel,
      multiple,
      options,
    };
  });
}