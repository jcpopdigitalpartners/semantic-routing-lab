import { motion } from "framer-motion";
import { Activity, DollarSign, Gauge, Target, Zap } from "lucide-react";
import ScoreFactorBadge from "./ScoreFactorBadge.jsx";

function RingGauge({ value, label, color, size = 88, factorId }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="ring-gauge" style={{ width: size, height: size }}>
      {factorId ? <ScoreFactorBadge factorId={factorId} size="xs" className="ring-factor-badge" /> : null}
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1830" strokeWidth="6" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="ring-gauge-center">
        <strong>{Math.round(value)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function LlmBar({ stat }) {
  const color = stat.color ?? "#a78bfa";

  return (
    <div className="llm-bar-row">
      <div className="llm-bar-meta">
        <span className="llm-bar-name">{stat.model}</span>
        <span className="llm-bar-count">{stat.count} calls</span>
      </div>
      <div className="llm-bar-track">
        <motion.div
          className="llm-bar-fill"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          initial={{ width: 0 }}
          animate={{ width: `${stat.efficiency}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <div className="llm-bar-stats">
        <span>{(stat.avgQuality * 100).toFixed(0)}% quality</span>
        <span>{stat.avgLatency.toFixed(0)}ms</span>
        <span>${stat.avgCost.toFixed(4)}</span>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, value, label, factorId }) {
  return (
    <div className="kpi-card">
      {factorId ? <ScoreFactorBadge factorId={factorId} size="xs" className="kpi-factor-badge" /> : null}
      <Icon size={16} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function EfficiencyDashboard({ metrics, compact = false }) {
  const hasData = metrics.totalRequests > 0;

  if (!hasData && compact) {
    return (
      <div className="dash-empty">
        <Gauge size={20} />
        <p>Run requests in the lab to populate efficiency metrics.</p>
      </div>
    );
  }

  return (
    <div className={`efficiency-dash ${compact ? "compact" : ""}`}>
      <div className="dash-header">
        <div>
          <h3>Efficiency Observatory</h3>
          <p>Your roster vs routing accuracy — no prescribed winners</p>
        </div>
        {hasData ? (
          <span className="dash-live-badge">
            <Activity size={12} />
            {metrics.totalRequests} routed
          </span>
        ) : null}
      </div>

      <div className="dash-rings">
        <RingGauge
          value={hasData ? metrics.routingEfficiency : 0}
          label="Routing"
          color="#22d3ee"
          factorId={1}
        />
        <RingGauge
          value={
            hasData && metrics.llmStats.length
              ? metrics.llmStats.reduce((a, s) => a + s.efficiency, 0) / metrics.llmStats.length
              : 0
          }
          label="LLM avg"
          color="#f472b6"
          factorId={3}
        />
        <RingGauge
          value={hasData ? metrics.routingAccuracy * 100 : 0}
          label="Accuracy"
          color="#a78bfa"
          factorId={1}
        />
      </div>

      <div className="dash-kpis">
        <KpiCard
          icon={Target}
          value={hasData ? `${(metrics.routingAccuracy * 100).toFixed(0)}%` : "—"}
          label="Route accuracy"
          factorId={1}
        />
        <KpiCard
          icon={Zap}
          value={hasData ? `${metrics.avgRoutingMs.toFixed(0)}ms` : "—"}
          label="Avg routing"
        />
        <KpiCard
          icon={Gauge}
          value={hasData ? `${metrics.avgLlmMs.toFixed(0)}ms` : "—"}
          label="Avg LLM"
          factorId={3}
        />
        <KpiCard
          icon={DollarSign}
          value={hasData ? `$${metrics.totalCostUsd.toFixed(3)}` : "—"}
          label="Session cost"
          factorId={4}
        />
      </div>

      {hasData && metrics.llmStats.length > 0 ? (
        <div className="dash-llm-section">
          <h4>
            Per-LLM efficiency
            <ScoreFactorBadge factorId={3} size="xs" className="inline-badge" />
          </h4>
          <p className="dash-llm-sub">Quality ÷ (cost × latency) — higher is better</p>
          {metrics.llmStats.map((stat) => (
            <LlmBar key={stat.model} stat={stat} />
          ))}
        </div>
      ) : null}

      {hasData && metrics.history.length > 0 ? (
        <div className="dash-feed">
          <h4>Recent routes</h4>
          <ul>
            {metrics.history.slice(0, 5).map((entry) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className={entry.correct ? "feed-ok" : "feed-miss"}
              >
                <span className="feed-label">{entry.inputLabel}</span>
                <span className="feed-route">{entry.actualRoute} → {entry.model}</span>
                <span className="feed-meta">
                  {entry.correct ? "✓" : "✗"} · {(entry.confidence * 100).toFixed(0)}% · {entry.totalLatencyMs}ms
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
