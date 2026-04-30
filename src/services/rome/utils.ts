export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function uniqBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const itemKey = key(item);
    if (!itemKey || seen.has(itemKey)) continue;
    seen.add(itemKey);
    result.push(item);
  }

  return result;
}

export function compact<T>(items: Array<T | undefined | null>): T[] {
  return items.filter((item): item is T => item !== undefined && item !== null);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
