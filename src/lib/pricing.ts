export function computeConfiguredPriceCents(args: {
  base: number; woodDelta: number; finishDelta: number; sizeDelta: number;
}): number {
  const total = args.base + args.woodDelta + args.finishDelta + args.sizeDelta;
  return Math.max(0, total);
}
