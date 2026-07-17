/**
 * Represents a single item within the game. An item might be a part of a {@link Chain}.
 */
export interface Item {
  level: number | string;
  name: string;
  description?: string;
  image?: string;
}

export interface Chain {
  id: string;
  name: string;
  levels: Item[];
}

export interface Inventory {
  levelItems: number[];
  // TODO: allow dimensional jars
}

export interface Goal {
  name: string;
  description: string;
  wanted: number[];
}

export interface ChainData {
  chainId: string;
  inventory: Inventory;
  goals: Goal[];
}

export function createChainData(
  chainId: string,
  forUseState: boolean = false,
): ChainData {
  const chain = findChainById(chainId);
  console.log("createChainData for ", chainId, "forUseState:", forUseState);
  if (!chain) {
    throw new Error(`Chain with id ${chainId} not found`);
  }

  let chainData: ChainData = {
    chainId,
    inventory: { levelItems: new Array<number>(chain.levels.length).fill(0) },
    goals: [
      {
        name: "1 of each",
        description: "1 of each",
        wanted: new Array<number>(chain.levels.length).fill(1),
      },
      {
        name: "1 of max",
        description: "1 of max",
        wanted: new Array<number>(chain.levels.length).fill(0),
      },
    ],
  };
  chainData.goals[1].wanted[chain.levels.length - 1] = 1;
  console.log("createChainData", chainData);
  return chainData;
}

function findChainById(chainId: string): Chain | undefined {
  return CHAINS.find((c) => c.id === chainId);
}
/**
 * TODO: This is a temporary hard-coded list of chains. In the future, this should be loaded from * a JSON file.
 */
export const CHAINS: Chain[] = [
  {
    id: "crystal-shards",
    name: "Crystal Shards ",
    levels: [
      { level: 1, name: "Crystal Shard" },
      { level: 2, name: "Chipped Crystal" },
      { level: 3, name: "Polished Crystal" },
      { level: 4, name: "Flawless Crystal" },
      { level: 5, name: "Radiant Crystal" },
    ],
  },
  {
    id: "grass",
    name: "Grass",
    levels: [
      { level: 0, name: "Mysterious Seed" },
      { level: 1, name: "Grass Tuft" },
      { level: 2, name: "Lawn Grass" },
      { level: 3, name: "Great Grass" },
      { level: 4, name: "Marsh Grass" },
      { level: 5, name: "Tall Grass" },
      { level: 6, name: "Golden Wheatgrass" },
      { level: 7, name: "Dragon's Whisker" },
      { level: 8, name: "Radiant Grass" },
      { level: "Wonder", name: "Ensnared Virtue" },
    ],
  },
];

/**
 * Computes, per goal in chainData.goals, how many of each level are still
 * needed given the current inventory. This is derived data: it's computed
 * fresh from ChainData rather than stored on it, so ChainData (inventory +
 * goals' `wanted`) stays exactly what should be persisted, e.g. to
 * localStorage, with nothing stale or computed mixed in.
 */
export function calculateGoalNeeds(chainData: ChainData): number[][] {
  return chainData.goals.map((goal) =>
    computeNeeded(chainData.inventory.levelItems, goal.wanted),
  );
}

function computeNeeded(have: number[], wanted: number[]): number[] {
  const needed: number[] = [...wanted];
  let index = needed.length - 1;
  needed[index] = Math.max(0, wanted[index] - have[index]);
  // Start from the highest level and work downwards.
  for (; index >= 0; index--) {
    let needFromLevelAbove = needed[index + 1] ?? 0;
    // We know how many we need at this level based on the number still needed from the level above, and the additional number we want at this level and the number we already have at this level.
    let needThisLevel =
      Math.trunc(needFromLevelAbove / 2) * 5 + // Currently only calculate optimal merging. 5 merge where we can and 3 merge for any remainder.
      (needFromLevelAbove % 2) * 3 +
      wanted[index] -
      have[index];

    needed[index] = Math.max(0, needThisLevel);
  }
  return needed;
}
