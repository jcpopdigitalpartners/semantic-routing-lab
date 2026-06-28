import { EFFICIENCY_FACTORS } from "../data/scoreFactors.js";
import ScoreFactorBadge from "./ScoreFactorBadge.jsx";

function formatPts(pts, factorId) {
  if (factorId === 4) return `−${Math.abs(pts).toFixed(1)}`;
  return `+${pts.toFixed(factorId === 1 ? 0 : 1)}`;
}

export default function EfficiencyScoreGuide({ breakdown }) {
  return (
    <div className="score-guide">
      <div className="score-guide-head">
        <h4>Score formula</h4>
        <span className="score-guide-sum">① + ② + ③ − ④</span>
      </div>
      <ol className="score-factor-list">
        {EFFICIENCY_FACTORS.map((factor) => {
          const line = breakdown?.factors.find((f) => f.id === factor.id);
          return (
            <li key={factor.id} className="score-factor-row">
              <ScoreFactorBadge factorId={factor.id} />
              <div className="score-factor-copy">
                <strong>{factor.label}</strong>
                <span>{factor.formula}</span>
                <em>{factor.uiHint}</em>
              </div>
              {line != null ? (
                <span
                  className={`score-factor-pts ${factor.id === 4 ? "penalty" : ""}`}
                  style={{ color: factor.color }}
                >
                  {formatPts(line.pts, factor.id)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
