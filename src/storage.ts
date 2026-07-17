const INVENTORY_STORAGE_KEY = "mergedragons-tracker:inventory:v1";

export type InventoryByChain = Record<string, number[]>;

export function loadInventoryByChain(): InventoryByChain {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Merges into whatever's already stored rather than overwriting it, so
// chains that aren't currently loaded into memory (e.g. never visited this
// session) don't get their saved inventory wiped out.
export function saveInventoryByChain(inventory: InventoryByChain): void {
  try {
    const merged = { ...loadInventoryByChain(), ...inventory };
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage can throw in private browsing / when quota is exceeded.
    // The app still works, it just won't persist between visits.
  }
}
