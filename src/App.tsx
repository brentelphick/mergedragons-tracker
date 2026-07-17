import { useMemo, useState } from "react";
import {
  CHAINS,
  calculateGoalNeeds,
  createChainData,
  type ChainData,
} from "./mergeEngine";
import "./App.css";

function App() {
  const [currentChain, setCurrentChain] = useState(CHAINS[0]);

  const [chainDataMap, setChainDataMap] = useState<Record<string, ChainData>>(
    () => ({
      [CHAINS[0].id]: createChainData(CHAINS[0].id),
    }),
  );

  const currentChainData = useMemo(
    () => chainDataMap[currentChain.id] ?? createChainData(currentChain.id),
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
        prev[currentChain.id] ?? createChainData(currentChain.id);
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
        : { ...prev, [nextChain.id]: createChainData(nextChain.id) },
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
                <th>Name</th>
                <th>Have</th>
                {currentChainData.goals.map((goal, index) => (
                  <th key={index}>{goal.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentChainData.inventory.levelItems.map((_, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{currentChain.levels[index]?.name}</td>
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
                    <td key={goalIndex}>{goalNeeds[goalIndex]?.[index] ?? 0}</td>
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
