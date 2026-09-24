import { useState } from "react";
import { DashboardContainer } from "./containers/DashboardContainer";

export default function App() {
  const [flaky, setFlaky] = useState(false);
  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">ThreatLens</h1>
          <p className="app__subtitle">Threat alert triage across leaked credentials, phishing domains and exposed assets (synthetic data)</p>
        </div>
        <label className="app__subtitle">
          <input type="checkbox" checked={flaky} onChange={(e) => setFlaky(e.target.checked)} /> Simulate flaky API (503s, auto-retry)
        </label>
      </header>
      <DashboardContainer flaky={flaky} />
    </div>
  );
}
