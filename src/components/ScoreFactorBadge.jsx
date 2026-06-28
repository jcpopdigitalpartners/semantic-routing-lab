import { getFactor } from "../data/scoreFactors.js";

export default function ScoreFactorBadge({
  factorId,
  size = "sm",
  title,
  className = "",
}) {
  const factor = getFactor(factorId);
  if (!factor) return null;

  const tip = title ?? `${factor.id}. ${factor.label} — ${factor.description}`;

  return (
    <span
      className={`score-factor-badge size-${size} ${className}`.trim()}
      style={{ "--factor-color": factor.color }}
      title={tip}
      aria-label={tip}
    >
      {factor.id}
    </span>
  );
}
