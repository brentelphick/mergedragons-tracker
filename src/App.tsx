import { useMemo, useState } from "react";
import {
  CHAINS,
  calculateChainData,
  createChainData,
  type ChainData,
} from "./mergeEngine";
import "./App.css";

function App() {
  const [currentChain, setStateCurrentChain] = useState(CHAINS[0]);
  // const currentChain = useMemo(
  //   () => CHAINS.find((c) => c.id === currentChainId) ?? CHAINS[0],
  //   [currentChainId],
  // );

  const [chainDataMap, setStateChainDataMap] = useState<
    Record<string, ChainData>
  >(() => ({
    [currentChain.id]: createChainData(currentChain.id, true),
  }));

  const updateChainData = (chainId: string, newData: ChainData) => {
    setStateChainDataMap((prev) => ({
      ...prev,
      [chainId]: newData,
    }));
  };

  const currentChainData = useMemo(() => {
    return calculateChainData(currentChain.id, chainDataMap[currentChain.id]);
  }, [chainDataMap, currentChain.id]);

  const setHave = (index: number, value: number) => {
    console.log("setHave: ", index, value, "for", currentChain.id);
    currentChainData.inventory.levelItems[index] = Math.max(
      0,
      Math.floor(value) || 0,
    );

    console.log(
      "setHave`",
      index,
      value,
      "for",
      currentChain.id,
      "calling updateChainData",
    );

    updateChainData(
      currentChain.id,
      calculateChainData(currentChain.id, chainDataMap[currentChain.id]),
    );
  };

  const handleChainChange = (id: string) => {
    console.log("handleChainChange from", currentChain.id, "to", id);
    const nextChain = CHAINS.find((c) => c.id === id) ?? CHAINS[0];
    setStateCurrentChain(nextChain);

    // I don't think we need to do anything else.
    // if (!chainDataMap[nextChain.id]) {
    //   updateChainData(nextChain.id, createChainData(nextChain.id));
    // }
    // updateChainData(
    //   nextChain.id,
    //   calculateChainData(chainDataMap[currentChain.id]),
    // );
    console.log(
      "handleChainChange: after setCurrentChain we have: ",
      currentChain.id,
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
                  {currentChainData.goals.map((goal, goalIndex) => (
                    <td key={goalIndex}>{goal.needed?.[index] ?? 0}</td>
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
