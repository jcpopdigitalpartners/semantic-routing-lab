import { useCallback, useMemo, useState } from "react";
import Hub from "./components/Hub";
import RoutingLab from "./components/RoutingLab";
import { createMetricsStore } from "./engine/metricsStore";
import { createGameStore } from "./engine/gameStore";

export default function App() {
  const [view, setView] = useState("hub");
  const [metricsStore] = useState(() => createMetricsStore());
  const [gameStore] = useState(() => createGameStore());
  const [runCount, setRunCount] = useState(0);

  const metrics = useMemo(() => metricsStore.getSummary(), [metricsStore, runCount]);
  const game = useMemo(() => gameStore.getSummary(metrics), [gameStore, metrics, runCount]);

  const handleRunComplete = useCallback(() => {
    setRunCount((c) => c + 1);
  }, []);

  const handleResetMetrics = useCallback(() => {
    metricsStore.reset();
    gameStore.reset();
    setRunCount(0);
  }, [metricsStore, gameStore]);

  if (view === "hub") {
    return (
      <Hub
        metrics={metrics}
        game={game}
        onEnterLab={() => setView("lab")}
      />
    );
  }

  return (
    <RoutingLab
      metricsStore={metricsStore}
      gameStore={gameStore}
      metrics={metrics}
      game={game}
      onBack={() => setView("hub")}
      onRunComplete={handleRunComplete}
      onResetMetrics={handleResetMetrics}
    />
  );
}
