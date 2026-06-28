import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleHelp, Play, RotateCcw, Sparkles } from "lucide-react";
import { DEFAULT_ROSTER, MODEL_CATALOG } from "../data/models.js";
import { STARTER_CODE } from "../data/config.js";
import { isGuidanceDone } from "../data/labGuideSteps.js";
import { SAMPLE_INPUTS, getSample } from "../data/samples.js";
import {
  buildLangGraphSteps,
  generateRosterCode,
  getActiveRouteFromStep,
  getCompletedNodeIds,
  playbackSteps,
  validateRouterCode,
} from "../engine/langGraphSimulator.js";
import { buildRosterProfiles, createModelRegistry } from "../engine/modelRegistry.js";
import PythonEditor from "./PythonEditor";
import InputDock from "./InputDock";
import LangGraphCanvas from "./LangGraphCanvas";
import GraphStepDetail from "./GraphStepDetail";
import RouteResultHover from "./RouteResultHover";
import ModelRoster from "./ModelRoster";
import EfficiencyDashboard from "./EfficiencyDashboard";
import EfficiencyGame from "./EfficiencyGame";
import LabGuidance from "./LabGuidance";

export default function RoutingLab({
  metricsStore,
  gameStore,
  metrics,
  game,
  onBack,
  onRunComplete,
  onResetMetrics,
}) {
  const [registry] = useState(() => createModelRegistry(MODEL_CATALOG));
  const [roster, setRoster] = useState({ ...DEFAULT_ROSTER });
  const [code, setCode] = useState(STARTER_CODE);
  const [selectedId, setSelectedId] = useState(SAMPLE_INPUTS[0].id);
  const [customPrompt, setCustomPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pullMessage, setPullMessage] = useState(null);
  const [lastRunScore, setLastRunScore] = useState(null);
  const [lastRunBreakdown, setLastRunBreakdown] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!isGuidanceDone()) {
      setGuideOpen(true);
    }
  }, []);

  const rosterProfiles = useMemo(
    () => buildRosterProfiles(registry, roster),
    [registry, roster]
  );

  const input = useMemo(() => {
    const base = getSample(selectedId) ?? SAMPLE_INPUTS[0];
    if (customPrompt.trim()) {
      return { ...base, prompt: customPrompt.trim(), label: "Custom prompt" };
    }
    return base;
  }, [selectedId, customPrompt]);

  const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : null;
  const completedNodes = useMemo(
    () => getCompletedNodeIds(steps, activeStepIndex),
    [steps, activeStepIndex]
  );
  const activeRoute = getActiveRouteFromStep(activeStep) ?? result?.route ?? null;
  const branchTaken = result?.branchTaken ?? activeStep?.branchTaken ?? null;

  const resetTrace = useCallback(() => {
    setSteps([]);
    setActiveStepIndex(-1);
    setResult(null);
    setError(null);
    setLastRunBreakdown(null);
  }, []);

  useEffect(() => {
    resetTrace();
  }, [selectedId, customPrompt, roster, resetTrace]);

  const handleRosterChange = useCallback((route, modelId) => {
    setRoster((prev) => ({ ...prev, [route]: modelId }));
    setPullMessage(null);
  }, []);

  const handlePullHf = useCallback(
    async (modelId) => {
      const res = registry.pullHf(modelId);
      if (!res.ok) {
        setPullMessage(res.message);
        return;
      }
      setPullMessage(
        res.duplicate
          ? `Already in pool: ${res.model.displayName}`
          : `Pulled ${res.model.displayName} — assign it to a route`
      );
    },
    [registry]
  );

  const syncCodeRoster = useCallback(() => {
    const snippet = generateRosterCode(roster, registry.getPool());
    setCode((prev) => {
      if (/ROUTE_MODELS\s*=\s*\{/.test(prev)) {
        return prev.replace(/ROUTE_MODELS\s*=\s*\{[^}]*\}/s, snippet);
      }
      return prev;
    });
  }, [roster, registry]);

  useEffect(() => {
    syncCodeRoster();
  }, [roster, syncCodeRoster]);

  const handleStepChange = useCallback(
    (index) => {
      if (index < 0 || index >= steps.length) return;
      setActiveStepIndex(index);
    },
    [steps.length]
  );

  const handleRun = async () => {
    const validation = validateRouterCode(code);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setRunning(true);
    setError(null);
    resetTrace();

    try {
      const run = buildLangGraphSteps(input, roster, registry);
      setSteps(run.steps);
      setResult(run.result);
      setLastRunScore(run.result.gameScore);
      setLastRunBreakdown(run.result.scoreBreakdown);

      await playbackSteps(run.steps, (_step, index) => {
        setActiveStepIndex(index);
      }, 450);

      metricsStore.record(run.result, input);
      gameStore.recordRun(run.result, input, roster);
      onRunComplete?.();
    } catch (err) {
      setError(err.message ?? "Routing failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="routing-lab">
      <LabGuidance open={guideOpen} onClose={() => setGuideOpen(false)} />

      <header className="lab-header">
        <button type="button" className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Hub
        </button>
        <div className="lab-header-title">
          <Sparkles size={16} />
          <strong>Efficiency Challenge</strong>
        </div>
        <div className="lab-header-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm lab-guide-btn"
            onClick={() => setGuideOpen(true)}
            aria-label="Show guided tour"
          >
            <CircleHelp size={14} />
            Guide
          </button>
          <button type="button" className="btn btn-ghost" onClick={onResetMetrics}>
            Reset scores
          </button>
          <button
            type="button"
            className="btn btn-primary"
            data-guide="run"
            onClick={handleRun}
            disabled={running}
          >
            <Play size={14} />
            {running ? "Running..." : "Route request"}
          </button>
        </div>
      </header>

      <div className="lab-grid">
        <div className="lab-col lab-col-input">
          <div className="lab-col-scroll">
            <div data-guide="inbox">
              <InputDock
                selectedId={selectedId}
                onSelect={setSelectedId}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
              />
            </div>

            <div data-guide="roster">
              <ModelRoster
                registry={registry}
                roster={roster}
                onRosterChange={handleRosterChange}
                onPullHf={handlePullHf}
                pullMessage={pullMessage}
              />
            </div>

            <div className="editor-block" data-guide="code">
              <div className="editor-block-head">
                <span>router_agent.py</span>
                <div className="editor-block-actions">
                  <RouteResultHover result={result} />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCode(STARTER_CODE)}>
                    <RotateCcw size={12} /> Reset code
                  </button>
                </div>
              </div>
              <PythonEditor code={code} filename="router_agent.py" onChange={setCode} />
            </div>

            {error ? <div className="output-error">{error}</div> : null}
          </div>
        </div>

        <div className="lab-col lab-col-graph">
          <div className="lab-col-graph-viz">
            <LangGraphCanvas
              currentNode={activeStep?.id ?? null}
              completedNodes={completedNodes}
              activeRoute={activeRoute}
              branchTaken={branchTaken}
              running={running}
              rosterProfiles={rosterProfiles}
            />
          </div>
          <div className="lab-col-graph-guide">
            <GraphStepDetail
              steps={steps}
              activeStepIndex={activeStepIndex}
              running={running}
              onStepChange={handleStepChange}
            />
          </div>
        </div>

        <div className="lab-col lab-col-dash">
          <div className="lab-col-scroll" data-guide="score">
            <EfficiencyGame game={game} lastRunScore={lastRunScore} lastRunBreakdown={lastRunBreakdown} />
            <EfficiencyDashboard metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}
