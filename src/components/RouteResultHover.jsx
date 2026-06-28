import { Info } from "lucide-react";
import ScoreFactorBadge from "./ScoreFactorBadge.jsx";

export default function RouteResultHover({ result }) {
  if (!result) return null;

  const breakdown = result.scoreBreakdown;

  return (
    <div className="route-info-hover">
      <button
        type="button"
        className="route-info-trigger"
        aria-label={`Routing result: ${result.llm.model}`}
      >
        <Info size={14} aria-hidden="true" />
        <span className="route-info-trigger-label">Routed to LLM</span>
      </button>

      <div className="route-info-popover" role="tooltip">
        <div className="route-info-popover-head">
          <span>Routed to</span>
          <strong style={{ color: result.llm.color }}>{result.llm.model}</strong>
          <span className={result.routingCorrect ? "badge-ok" : "badge-warn"}>
            {result.routingCorrect ? "Correct route" : "Suboptimal route"}
          </span>
        </div>
        <p className="route-info-popover-body">{result.response}</p>
        <div className="route-info-popover-meta">
          <span>{result.totalLatencyMs}ms total</span>
          <span>${result.costUsd.toFixed(4)}</span>
          <span>{(result.qualityScore * 100).toFixed(0)}% quality</span>
        </div>
        {breakdown ? (
          <ul className="route-score-breakdown">
            {breakdown.factors.map((line) => (
              <li key={line.id}>
                <ScoreFactorBadge factorId={line.id} size="xs" />
                <span>{line.id === 4 ? "−" : "+"}{Math.abs(line.pts).toFixed(line.id === 1 ? 0 : 1)}</span>
              </li>
            ))}
            <li className="route-score-total">
              <span>=</span>
              <strong>+{breakdown.total}</strong>
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
