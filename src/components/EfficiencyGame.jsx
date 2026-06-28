import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import EfficiencyScoreGuide from "./EfficiencyScoreGuide.jsx";

export default function EfficiencyGame({ game, lastRunScore, lastRunBreakdown }) {
  const { bestScore, tier, nextTier, pointsToNext, challenges, recentRuns } = game;

  return (
    <div className="efficiency-game">
      <div className="game-score-hero">
        <div className="game-score-main">
          <Trophy size={20} style={{ color: tier?.color ?? "var(--text-muted)" }} />
          <div>
            <span className="game-score-label">Best run score</span>
            <strong className="game-score-value">{bestScore || "—"}</strong>
          </div>
        </div>
        {lastRunScore != null ? (
          <motion.span
            className="game-last-run"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={lastRunScore}
          >
            Last: +{lastRunScore}
          </motion.span>
        ) : null}
        {tier ? (
          <span className="game-tier" style={{ borderColor: tier.color, color: tier.color }}>
            {tier.label}
          </span>
        ) : (
          <span className="game-tier game-tier-none">Unranked</span>
        )}
      </div>

      {nextTier ? (
        <p className="game-next-tier">
          {pointsToNext} pts to <strong style={{ color: nextTier.color }}>{nextTier.label}</strong>
        </p>
      ) : (
        <p className="game-next-tier">Max tier reached — keep optimizing cost vs quality.</p>
      )}

      <EfficiencyScoreGuide breakdown={lastRunBreakdown} />

      <div className="game-challenges">
        <h4>Challenges</h4>
        <ul>
          {challenges.map((c) => (
            <li key={c.id} className={c.done ? "done" : ""}>
              {c.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              {c.text}
            </li>
          ))}
        </ul>
      </div>

      {recentRuns.length > 0 ? (
        <div className="game-recent">
          <h4>Recent scores</h4>
          <ul>
            {recentRuns.map((r) => (
              <li key={r.id}>
                <span>+{r.gameScore}</span>
                <span className="game-recent-meta">{r.inputLabel}</span>
                <span className="game-recent-model">{r.model.split("/").pop()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
