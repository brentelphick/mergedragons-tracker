import { useMemo, useState } from "react";
import { CHAINS, calculate } from "./mergeEngine";
import "./App.css";

function App() {
  const [chainId, setChainId] = useState(CHAINS[0].id);
  const chain = useMemo(() => CHAINS.find((c) => c.id === chainId) ?? CHAINS[0], [chainId]);

  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [goalTierId, setGoalTierId] = useState(chain.tiers[chain.tiers.length - 1].id);
  const [goalQty, setGoalQty] = useState(1);

  const result = useMemo(
    () => calculate(chain, inventory, goalTierId, goalQty, "mixed"),
    [chain, inventory, goalTierId, goalQty]
  );

  const setHave = (tierId: number, value: number) => {
    setInventory((prev) => ({ ...prev, [tierId]: Math.max(0, Math.floor(value) || 0) }));
  };

  const handleChainChange = (id: string) => {
    setChainId(id);
    const nextChain = CHAINS.find((c) => c.id === id) ?? CHAINS[0];
    setInventory({});
    setGoalTierId(nextChain.tiers[nextChain.tiers.length - 1].id);
  };

  return (
    <div className="page">
      <header className="masthead">
        <h1>Merge Chain Calculator</h1>
        <p>Enter what you have, set your goal, and see exactly what you're short.</p>
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
                  aria-selected={chainId === c.id}
                  className={`chain-tab ${chainId === c.id ? "active" : ""}`}
                  onClick={() => handleChainChange(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <span className="field-group-label">Goal</span>
            <div className="goal-row">
              <select value={goalTierId} onChange={(e) => setGoalTierId(Number(e.target.value))}>
                {chain.tiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={goalQty}
                onChange={(e) => setGoalQty(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                aria-label="Goal quantity"
              />
            </div>
          </div>
        </section>

        <section className="panel results">
          <div className="summary-card">
            <span className="summary-label">You still need</span>
            <span className="summary-value">
              {result.baseItemsNeeded.toLocaleString()} {chain.tiers[0].name}
              {result.baseItemsNeeded === 1 ? "" : "s"}
            </span>
          </div>

          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Level</th>
                <th>Have</th>
                <th>Need</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.tierId} className={row.deficit > 0 ? "short" : ""}>
                  <td>{row.tierId}</td>
                  <td>{row.name}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={inventory[row.tierId] ?? 0}
                      onChange={(e) => setHave(row.tierId, Number(e.target.value))}
                    />
                  </td>
                  <td>{row.need.toLocaleString()}</td>
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
