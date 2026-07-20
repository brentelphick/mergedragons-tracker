import { useEffect, useMemo, useState } from "react";
import {
  CHAINS,
  calculateGoalNeeds,
  createChainData,
  type ChainData,
} from "./mergeEngine";
import { loadInventoryByChain, saveInventoryByChain } from "./storage";
import "./App.css";

// Fresh ChainData for a chain, with any inventory counts saved from a
// previous visit layered on top (if they still match the chain's shape).
function chainDataWithStoredInventory(chainId: string): ChainData {
  const chainData = createChainData(chainId);
  const storedLevelItems = loadInventoryByChain()[chainId];
  if (storedLevelItems?.length === chainData.inventory.levelItems.length) {
    chainData.inventory.levelItems = [...storedLevelItems];
  }
  return chainData;
}

function App() {
  const [currentChain, setCurrentChain] = useState(CHAINS[0]);

  const [chainDataMap, setChainDataMap] = useState<Record<string, ChainData>>(
    () => ({
      [CHAINS[0].id]: chainDataWithStoredInventory(CHAINS[0].id),
    }),
  );

  useEffect(() => {
    const inventoryByChain: Record<string, number[]> = {};
    for (const [chainId, data] of Object.entries(chainDataMap)) {
      inventoryByChain[chainId] = data.inventory.levelItems;
    }
    saveInventoryByChain(inventoryByChain);
  }, [chainDataMap]);

  const currentChainData = useMemo(
    () =>
      chainDataMap[currentChain.id] ??
      chainDataWithStoredInventory(currentChain.id),
    [chainDataMap, currentChain.id],
  );

  // goalNeeds[goalIndex][levelIndex] — derived from currentChainData, never
  // stored back onto it, so ChainData stays exactly what's safe to persist.
  const goalNeeds = useMemo(
    () => calculateGoalNeeds(currentChainData),
    [currentChainData],
  );

  const setHave = (index: number, value: number) => {
    const nextValue = Math.max(0, Math.floor(value) || 0);
    console.log("setHave:", index, nextValue, "for", currentChain.id);

    setChainDataMap((prev) => {
      const prevChainData =
        prev[currentChain.id] ?? chainDataWithStoredInventory(currentChain.id);
      const nextLevelItems = [...prevChainData.inventory.levelItems];
      nextLevelItems[index] = nextValue;

      return {
        ...prev,
        [currentChain.id]: {
          ...prevChainData,
          inventory: { levelItems: nextLevelItems },
        },
      };
    });
  };

  const handleChainChange = (id: string) => {
    console.log("handleChainChange from", currentChain.id, "to", id);
    const nextChain = CHAINS.find((c) => c.id === id) ?? CHAINS[0];
    setCurrentChain(nextChain);

    setChainDataMap((prev) =>
      prev[nextChain.id]
        ? prev
        : {
            ...prev,
            [nextChain.id]: chainDataWithStoredInventory(nextChain.id),
          },
    );
  };

  return (
    <div className="page">
      <header className="masthead">
        <h1>Merge Chain Calculator</h1>
        <p>
          Enter what you have, set your goal, and see exactly what you're short.
        </p>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="field-group">
            <span className="field-group-label">Chain</span>
            <div className="chain-tabs" role="tablist" aria-label="Chain">
              {CHAINS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={currentChain.id === c.id}
                  className={`chain-tab ${currentChain.id === c.id ? "active" : ""}`}
                  onClick={() => handleChainChange(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel results">
          <div className="summary-card">
            <span className="summary-label">You still need</span>
          </div>

          <table className="results-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Item</th>
                <th>Have</th>
                {currentChainData.goals.map((goal, index) => (
                  <th key={index}>{goal.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentChainData.inventory.levelItems.map((_, index) => (
                <tr key={index}>
                  <td>{currentChain.levels[index]?.level}</td>
                  <td>
                    <div className="item-cell">
                      {currentChain.levels[index]?.image && (
                        <img
                          className="item-image"
                          src={currentChain.levels[index].image}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <span className="item-name">
                        {currentChain.levels[index]?.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={currentChainData.inventory.levelItems[index] ?? 0}
                      onChange={(e) => setHave(index, Number(e.target.value))}
                    />
                  </td>
                  {currentChainData.goals.map((_, goalIndex) => (
                    <td key={goalIndex}>
                      {goalNeeds[goalIndex]?.[index] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;
