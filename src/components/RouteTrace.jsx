import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, CheckCircle2, Circle } from "lucide-react";

function StepContent({ step }) {
  if (typeof step.content === "object") {
    return <pre className="trace-code">{JSON.stringify(step.content, null, 2)}</pre>;
  }
  return <pre className="trace-code">{String(step.content)}</pre>;
}

export default function RouteTrace({ steps, activeStepIndex, running }) {
  if (!steps?.length && !running) {
    return (
      <div className="trace-empty">
        <p>Route a request to watch the LangGraph trace.</p>
        <p className="trace-empty-sub">Each node shows state flowing through ingest → embed → route → LLM → metrics.</p>
      </div>
    );
  }

  return (
    <div className="trace-panel">
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => {
          const active = index <= activeStepIndex;
          const current = index === activeStepIndex;

          return (
            <motion.div
              key={step.id}
              className={`trace-step ${active ? "active" : ""} ${current ? "current" : ""} trace-type-${step.type}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: active ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
            >
              <div className="trace-step-head">
                <span className="trace-step-icon">
                  {active ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </span>
                <span className="trace-step-label">{step.label}</span>
                <span className="trace-step-type">{step.type}</span>
              </div>
              {active ? (
                <motion.div
                  className="trace-step-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  <StepContent step={step} />
                  {step.insight ? <p className="trace-step-insight">{step.insight}</p> : null}
                </motion.div>
              ) : null}
              {active && index < steps.length - 1 ? (
                <ArrowDown size={14} className="trace-arrow" aria-hidden="true" />
              ) : null}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {running ? (
        <div className="trace-running">
          <span className="trace-pulse" />
          Executing graph...
        </div>
      ) : null}
    </div>
  );
}
