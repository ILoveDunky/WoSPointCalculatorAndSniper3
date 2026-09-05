import type { SnipeResult } from './types';

export interface SnipeStock {
  name: string;
  /** Points earned per single unit of this resource */
  unitPoints: number;
  /** Items are often only spendable in fixed batches (e.g. "5 Mythic Shards" min) */
  batchSize: number;
  /** How many units of this resource the player actually has on hand right now */
  ownedQuantity: number;
}

/**
 * Above this, the exact solver would need a reachability array too large to
 * build instantly in a browser tab, so we fall back to a greedy pass. Real
 * sniping gaps (the point difference you're closing before a reset) are
 * almost always well under this in practice.
 */
const EXACT_SOLVE_CAP = 2_500_000;

interface Chunk {
  itemIndex: number;
  batches: number; // how many batches this synthetic chunk represents
  value: number; // points contributed if this chunk is taken
}

/** Standard binary decomposition: turns "up to N of this item" into O(log N)
 * all-or-nothing chunks so a bounded knapsack can be solved as a 0/1 knapsack. */
function splitIntoChunks(maxBatches: number, batchPoints: number, itemIndex: number): Chunk[] {
  const chunks: Chunk[] = [];
  let remaining = maxBatches;
  let size = 1;
  while (remaining > 0) {
    const take = Math.min(size, remaining);
    chunks.push({ itemIndex, batches: take, value: take * batchPoints });
    remaining -= take;
    size *= 2;
  }
  return chunks;
}

function greedyFallback(stocks: SnipeStock[], target: number): SnipeResult {
  const withCapacity = stocks
    .map((s) => ({ ...s, maxBatches: Math.floor(s.ownedQuantity / s.batchSize) }))
    .filter((s) => s.maxBatches > 0)
    .sort((a, b) => b.unitPoints * b.batchSize - a.unitPoints * a.batchSize);

  let remaining = target;
  const combo: SnipeResult['combo'] = [];

  for (const s of withCapacity) {
    if (remaining <= 0) break;
    const batchPoints = s.unitPoints * s.batchSize;
    const batchesWanted = Math.min(s.maxBatches, Math.ceil(remaining / batchPoints));
    if (batchesWanted > 0) {
      combo.push({ item: s.name, quantity: batchesWanted * s.batchSize, points: batchesWanted * batchPoints });
      remaining -= batchesWanted * batchPoints;
    }
  }

  const totalPoints = combo.reduce((sum, r) => sum + r.points, 0);
  return {
    combo: combo.sort((a, b) => b.points - a.points),
    totalPoints,
    overshoot: Math.max(0, totalPoints - target),
    exact: false,
    fellBackToGreedy: true,
  };
}

/**
 * Finds the cheapest (minimum-overshoot) way to reach at least `target`
 * points using only resources the player currently has on hand, spent in
 * whole batches. This is a bounded knapsack, solved as a 0/1 knapsack over
 * binary-split "chunks" of each resource, so owning e.g. 40,000 speedup
 * minutes doesn't blow up the search.
 */
export function solveSniping(rawStocks: SnipeStock[], target: number): SnipeResult {
  const stocks = rawStocks.filter((s) => s.unitPoints > 0 && s.batchSize > 0 && s.ownedQuantity > 0);
  if (stocks.length === 0 || target <= 0) {
    return { combo: [], totalPoints: 0, overshoot: 0, exact: true, fellBackToGreedy: false };
  }

  const withCapacity = stocks.map((s) => ({
    ...s,
    maxBatches: Math.floor(s.ownedQuantity / s.batchSize),
    batchPoints: s.unitPoints * s.batchSize,
  }));

  const totalAvailablePoints = withCapacity.reduce((sum, s) => sum + s.maxBatches * s.batchPoints, 0);
  if (totalAvailablePoints < target) {
    // Not enough on hand to close the gap at all — spend everything and
    // report how far short it still leaves you.
    return greedyFallback(stocks, target);
  }

  const chunks: Chunk[] = [];
  withCapacity.forEach((s, i) => {
    if (s.maxBatches > 0) chunks.push(...splitIntoChunks(s.maxBatches, s.batchPoints, i));
  });

  const maxChunkValue = Math.max(...chunks.map((c) => c.value));
  const cap = Math.min(target + maxChunkValue, totalAvailablePoints);

  if (cap > EXACT_SOLVE_CAP) {
    return greedyFallback(stocks, target);
  }

  const reachable = new Uint8Array(cap + 1);
  const parent = new Int32Array(cap + 1).fill(-1);
  reachable[0] = 1;

  for (let c = 0; c < chunks.length; c++) {
    const { value } = chunks[c];
    for (let s = cap; s >= value; s--) {
      if (reachable[s - value] && !reachable[s]) {
        reachable[s] = 1;
        parent[s] = c;
      }
    }
  }

  let best = -1;
  for (let s = target; s <= cap; s++) {
    if (reachable[s]) {
      best = s;
      break;
    }
  }

  if (best === -1) {
    return greedyFallback(stocks, target);
  }

  const batchesByItem: Record<number, number> = {};
  let s = best;
  while (s > 0) {
    const c = parent[s];
    if (c < 0) break;
    const chunk = chunks[c];
    batchesByItem[chunk.itemIndex] = (batchesByItem[chunk.itemIndex] || 0) + chunk.batches;
    s -= chunk.value;
  }

  const combo = Object.entries(batchesByItem)
    .map(([i, batches]) => {
      const stock = withCapacity[Number(i)];
      return {
        item: stock.name,
        quantity: batches * stock.batchSize,
        points: batches * stock.batchPoints,
      };
    })
    .sort((a, b) => b.points - a.points);

  return {
    combo,
    totalPoints: best,
    overshoot: best - target,
    exact: true,
    fellBackToGreedy: false,
  };
}
