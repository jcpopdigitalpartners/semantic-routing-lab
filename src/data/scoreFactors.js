/** Numbered factors that drive the per-run game / efficiency score. */
export const EFFICIENCY_FACTORS = [
  {
    id: 1,
    label: "Route match",
    shortLabel: "Routing",
    description: "Semantic router sends the request to the correct specialist path.",
    formula: "+25 if correct · +8 if wrong",
    maxPts: 25,
    color: "#22d3ee",
    uiHint: "Request inbox · accuracy ring",
  },
  {
    id: 2,
    label: "Model fit",
    shortLabel: "Quality",
    description: "How well your assigned model matches the routed task.",
    formula: "quality × 35 (0–35 pts)",
    maxPts: 35,
    color: "#a78bfa",
    uiHint: "Roster fit % per route",
  },
  {
    id: 3,
    label: "Speed–cost ratio",
    shortLabel: "Efficiency",
    description: "Quality relative to latency and token cost.",
    formula: "efficiency × 0.35 (0–35 pts)",
    maxPts: 35,
    color: "#f472b6",
    uiHint: "LLM latency · efficiency ring",
  },
  {
    id: 4,
    label: "Cost penalty",
    shortLabel: "Cost",
    description: "Expensive models drag the score down.",
    formula: "−min(15, cost × 200)",
    maxPts: -15,
    color: "#fb7185",
    uiHint: "Session cost KPI",
  },
];

export function getFactor(id) {
  return EFFICIENCY_FACTORS.find((f) => f.id === id) ?? null;
}
