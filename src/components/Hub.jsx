import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { LAB_META } from "../data/config.js";
import { GAME_TIERS, ROUTE_META } from "../data/models.js";
import EfficiencyDashboard from "./EfficiencyDashboard";

export default function Hub({ metrics, game, onEnterLab }) {
  return (
    <div className="hub">
      <div className="hub-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="hub-header">
        <div className="hub-brand">
          <div className="hub-logo">
            <GitBranch size={18} />
          </div>
          <div>
            <strong>{LAB_META.title}</strong>
            <span>{LAB_META.tagline}</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={onEnterLab}>
          Play <ArrowRight size={16} />
        </button>
      </header>

      <main className="hub-main">
        <section className="hero">
          <motion.p
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles size={14} /> LangGraph · Your models · Your score
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            Write your way to peak efficiency
          </motion.h1>
          <motion.p
            className="hero-copy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            {LAB_META.description}
          </motion.p>
        </section>

        <section className="game-tiers">
          {GAME_TIERS.map((tier, i) => (
            <motion.div
              key={tier.id}
              className={`tier-card ${game.tier?.id === tier.id ? "active" : ""}`}
              style={{ "--tier-color": tier.color }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
            >
              <Trophy size={18} />
              <strong>{tier.label}</strong>
              <span>{tier.minScore}+ pts</span>
            </motion.div>
          ))}
        </section>

        <section className="route-showcase">
          {Object.values(ROUTE_META).map((route, i) => (
            <motion.article
              key={route.id}
              className="route-card"
              style={{ "--route-color": route.color, "--route-glow": route.glow }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
            >
              <h3>{route.label}</h3>
              <p className="route-card-hint">You pick the model — API or Hugging Face</p>
            </motion.article>
          ))}
        </section>

        <section className="hub-pipeline">
          <div className="pipeline-label">
            <Zap size={14} /> How to win
          </div>
          <div className="pipeline-flow">
            {["Pick a request", "Assign models", "Route & read score", "Swap & retry"].map((node, i) => (
              <div key={node} className="pipeline-node-wrap">
                <div className="pipeline-node">{node}</div>
                {i < 3 ? <span className="pipeline-arrow">→</span> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="hub-dash-preview">
          <EfficiencyDashboard metrics={metrics} compact />
        </section>

        <div className="hub-cta">
          <button type="button" className="btn btn-glow" onClick={onEnterLab}>
            <Target size={18} /> Start efficiency run <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
