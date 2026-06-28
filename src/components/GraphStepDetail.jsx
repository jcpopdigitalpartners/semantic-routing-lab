import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getNodeGuide, OVERVIEW_INTRO_SLIDES } from "../data/graphGuide.js";
import OverviewCarousel from "./OverviewCarousel.jsx";

function StatePanel({ step }) {
  if (!step) return null;

  const entries = Object.entries(step.stateDelta ?? {});

  return (
    <div className="state-panel">
      <div className="state-panel-head">
        <span>RouterState delta</span>
        <span className="state-panel-sub">keys written this step</span>
      </div>
      <dl className="state-delta">
        {entries.map(([key, value]) => (
          <div key={key} className="state-delta-row">
            <dt>{key}</dt>
            <dd>
              {typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value).length > 80
                  ? String(value).slice(0, 80) + "…"
                  : String(value)}
            </dd>
          </div>
        ))}
      </dl>
      <details className="state-full">
        <summary>Full state after step</summary>
        <pre>{JSON.stringify(step.stateAfter, null, 2)}</pre>
      </details>
    </div>
  );
}

function OverviewSlideBody({
  phase,
  phaseClass = "entry",
  title,
  nodeName,
  summary,
  occurs,
  insight,
  codeHint,
  branchEdge,
  stateReads = [],
  stateWrites = [],
  step,
  hint,
}) {
  return (
    <article className="step-overview">
      <div className="step-overview-head">
        <span className={`step-phase phase-${phaseClass}`}>{phase}</span>
        <h3>{title}</h3>
        {nodeName ? <code className="step-node-name">{nodeName}</code> : null}
      </div>

      <p className="step-summary">{summary}</p>

      <div className="step-occurs">
        <strong>What&apos;s occurring</strong>
        <p>{occurs}</p>
      </div>

      {branchEdge ? (
        <div className="step-branch-callout">
          <ArrowRight size={14} />
          Conditional edge: <code>{branchEdge}</code>
        </div>
      ) : null}

      {stateReads.length > 0 || stateWrites.length > 0 ? (
        <div className="step-io">
          {stateReads.length > 0 ? (
            <div className="step-io-block">
              <span className="step-io-label reads">Reads</span>
              <div className="step-io-tags">
                {stateReads.map((k) => (
                  <span key={k} className="state-tag read">{k}</span>
                ))}
              </div>
            </div>
          ) : null}
          {stateWrites.length > 0 ? (
            <div className="step-io-block">
              <span className="step-io-label writes">Writes</span>
              <div className="step-io-tags">
                {stateWrites.map((k) => (
                  <span key={k} className="state-tag write">{k}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {insight ? <p className="step-insight">{insight}</p> : null}
      {codeHint ? <code className="step-code-hint">{codeHint}</code> : null}
      {hint ? <p className="step-guide-hint">{hint}</p> : null}
      {step ? <StatePanel step={step} /> : null}
    </article>
  );
}

const INTRO_PHASE_CLASS = {
  intro: "overview",
  "pre-routing": "process",
  branch: "router",
  exit: "exit",
};

function buildIntroSlides() {
  return OVERVIEW_INTRO_SLIDES.map((s) => ({
    id: s.id,
    title: s.title,
    content: (
      <OverviewSlideBody
        phase={s.phase}
        phaseClass={INTRO_PHASE_CLASS[s.id] ?? "entry"}
        title={s.title}
        summary={s.summary}
        occurs={s.occurs}
        codeHint={s.codeHint}
        hint={
          s.id === "exit"
            ? "Click Route request, then use the overview carousel below to step through each node."
            : null
        }
      />
    ),
  }));
}

function buildStepSlides(steps) {
  return steps.map((step) => {
    const guide = getNodeGuide(step.id);
    if (!guide) return null;

    return {
      id: step.id,
      title: guide.title,
      content: (
        <OverviewSlideBody
          phase={guide.phase}
          phaseClass={step.type}
          title={guide.title}
          nodeName={step.label}
          summary={guide.summary}
          occurs={guide.occurs}
          insight={step.insight}
          codeHint={guide.codeHint}
          branchEdge={step.type === "router" ? step.content?.conditionalEdge : null}
          stateReads={guide.stateReads}
          stateWrites={guide.stateWrites}
          step={step}
        />
      ),
    };
  }).filter(Boolean);
}

export default function GraphStepDetail({ steps, activeStepIndex, running, onStepChange }) {
  const [idleIndex, setIdleIndex] = useState(0);
  const hasSteps = steps.length > 0;

  const slides = useMemo(
    () => (hasSteps ? buildStepSlides(steps) : buildIntroSlides()),
    [hasSteps, steps]
  );

  const carouselIndex = hasSteps
    ? Math.max(activeStepIndex, 0)
    : idleIndex;

  const handleIndexChange = (index) => {
    if (hasSteps) {
      onStepChange?.(index);
    } else {
      setIdleIndex(index);
    }
  };

  return (
    <div className="step-detail">
      <OverviewCarousel
        slides={slides}
        activeIndex={carouselIndex}
        onIndexChange={handleIndexChange}
        label={hasSteps ? "Node overview" : "Pipeline overview"}
        syncLabel={hasSteps ? " · synced with graph" : null}
      />

      {running ? (
        <div className="step-running-banner">
          <span className="trace-pulse" />
          Executing graph…
        </div>
      ) : null}
    </div>
  );
}
