export interface Tier {
  id: number;
  name: string;
  /** Can this tier be produced by merging 3 of tier (id - 1)? */
  merge3: boolean;
  /** Can this tier be produced by merging 5 of tier (id - 2)? */
  merge5: boolean;
}

export interface Chain {
  id: string;
  name: string;
  tiers: Tier[];
}

export type Strategy = "3-only" | "5-only" | "mixed";

export interface TierResult {
  tierId: number;
  name: string;
  need: number;
  have: number;
  deficit: number;
  method: "3" | "5" | null;
  consumesFromLowerTier: number;
}

export interface CalculationResult {
  strategy: Strategy;
  goalTierId: number;
  goalQty: number;
  rows: TierResult[];
  baseItemsNeeded: number;
}

export const CHAINS: Chain[] = [
  {
    id: "crystal-shards",
    name: "Crystal Shards (Dragon Breeding)",
    tiers: [
      { id: 1, name: "Crystal Shard", merge3: false, merge5: false },
      { id: 2, name: "Chipped Crystal", merge3: true, merge5: false },
      { id: 3, name: "Polished Crystal", merge3: true, merge5: true },
      { id: 4, name: "Flawless Crystal", merge3: true, merge5: true },
      { id: 5, name: "Radiant Crystal", merge3: true, merge5: true },
    ],
  },
  {
    id: "grass",
    name: "Grass",
    tiers: [
      { id: 1, name: "Grass Tuft", merge3: false, merge5: false },
      { id: 2, name: "Lawn Grass", merge3: true, merge5: false },
      { id: 3, name: "Great Grass", merge3: true, merge5: true },
      { id: 4, name: "Marsh Grass", merge3: true, merge5: true },
      { id: 5, name: "Tall Grass", merge3: true, merge5: true },
    ],
  },
];

/**
 * For each tier above 1, decide which merge method produces it under the
 * given strategy, and the resulting cost in tier-1 items per unit.
 * 5-merges skip a tier (T-2 -> T), so they're compared against two
 * successive 3-merges when picking the cheaper "mixed" option.
 */
function computeCostsAndMethods(tiers: Tier[], strategy: Strategy) {
  const sorted = [...tiers].sort((a, b) => a.id - b.id);
  const maxId = sorted[sorted.length - 1].id;
  const byId = new Map(sorted.map((t) => [t.id, t]));

  const cost = new Array<number>(maxId + 1).fill(0);
  const method = new Array<"3" | "5" | null>(maxId + 1).fill(null);
  cost[1] = 1;

  for (let t = 2; t <= maxId; t++) {
    const tier = byId.get(t);
    if (!tier) continue;
    const options: { m: "3" | "5"; c: number }[] = [];
    if (tier.merge3) options.push({ m: "3", c: 3 * cost[t - 1] });
    if (tier.merge5 && t >= 3) options.push({ m: "5", c: 5 * cost[t - 2] });

    let chosen = options[0];
    if (strategy === "3-only") {
      chosen = options.find((o) => o.m === "3") ?? options[0];
    } else if (strategy === "5-only") {
      chosen =
        options.find((o) => o.m === "5") ??
        options.find((o) => o.m === "3") ??
        options[0];
    } else {
      chosen = options.reduce(
        (best, o) => (o.c < best.c ? o : best),
        options[0],
      );
    }
    cost[t] = chosen.c;
    method[t] = chosen.m;
  }

  return { cost, method, maxId, byId };
}

export function calculate(
  chain: Chain,
  inventory: Record<number, number>,
  goalTierId: number,
  goalQty: number,
  strategy: Strategy,
): CalculationResult {
  const { method, maxId, byId } = computeCostsAndMethods(chain.tiers, strategy);

  const needed = new Array<number>(maxId + 1).fill(0);
  needed[goalTierId] = goalQty;

  const rows: TierResult[] = [];
  for (let t = Math.min(goalTierId, maxId); t >= 1; t--) {
    const tier = byId.get(t);
    if (!tier) continue;
    const have = inventory[t] ?? 0;
    const need = needed[t] ?? 0;
    const deficit = Math.max(0, need - have);

    let usedMethod: "3" | "5" | null = null;
    let consumesFromLowerTier = 0;
    if (deficit > 0 && t > 1) {
      usedMethod = method[t];
      consumesFromLowerTier = usedMethod === "5" ? deficit * 5 : deficit * 3;
      if (usedMethod === "3") {
        needed[t - 1] = (needed[t - 1] ?? 0) + deficit * 3;
      } else if (usedMethod === "5") {
        needed[t - 2] = (needed[t - 2] ?? 0) + deficit * 5;
      }
    }

    rows.push({
      tierId: t,
      name: tier.name,
      need,
      have,
      deficit,
      method: usedMethod,
      consumesFromLowerTier,
    });
  }

  const tier1Row = rows[rows.length - 1];
  const baseItemsNeeded = tier1Row?.tierId === 1 ? tier1Row.deficit : 0;

  return { strategy, goalTierId, goalQty, rows, baseItemsNeeded };
}
