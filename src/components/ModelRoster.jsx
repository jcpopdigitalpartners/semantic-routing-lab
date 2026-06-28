import { useMemo, useState } from "react";
import { Download, FileText, MessageSquare, Table2, Trophy } from "lucide-react";
import { DEFAULT_ROSTER, MODEL_CATALOG, ROUTE_META } from "../data/models.js";
import { rosterFitPreview } from "../engine/modelRegistry.js";
import ScoreFactorBadge from "./ScoreFactorBadge.jsx";

const ROUTE_ICONS = { pdf: FileText, spreadsheet: Table2, unstructured: MessageSquare };

export default function ModelRoster({
  registry,
  roster,
  onRosterChange,
  onPullHf,
  pullMessage,
}) {
  const [hfInput, setHfInput] = useState("");
  const [pulling, setPulling] = useState(false);
  const pool = registry.getPool();
  const fitPreview = useMemo(() => rosterFitPreview(registry, roster), [registry, roster]);

  const handlePull = async () => {
    setPulling(true);
    await onPullHf(hfInput);
    setPulling(false);
    setHfInput("");
  };

  return (
    <div className="model-roster">
      <div className="model-roster-head">
        <Trophy size={14} />
        <div>
          <strong>Your model roster</strong>
          <span>
            Pick text or multimodal LLMs per route
            <ScoreFactorBadge factorId={2} className="inline-badge" />
            fit % drives quality points
          </span>
        </div>
      </div>

      <div className="roster-routes">
        {Object.entries(ROUTE_META).map(([route, meta]) => {
          const { label, color } = meta;
          const Icon = ROUTE_ICONS[route];
          const fit = fitPreview.find((f) => f.route === route);
          const fitPct = fit ? Math.round(fit.fit * 100) : 0;

          return (
            <div key={route} className="roster-route-row" style={{ "--route-color": color }}>
              <span className="roster-route-label">
                <Icon size={12} />
                {label}
              </span>
              <select
                className="roster-select"
                value={roster[route] ?? DEFAULT_ROSTER[route]}
                onChange={(e) => onRosterChange(route, e.target.value)}
                aria-label={`Model for ${label}`}
              >
                {pool.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.multimodal ? "👁 " : ""}{m.source === "huggingface" ? "🤗 " : ""}{m.displayName} ({m.provider})
                  </option>
                ))}
              </select>
              <span
                className={`roster-fit ${fitPct >= 80 ? "fit-great" : fitPct >= 60 ? "fit-ok" : "fit-weak"}`}
                title="Predicted route fit (factor ②)"
              >
                <ScoreFactorBadge factorId={2} size="xs" className="fit-badge" />
                {fitPct}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="hf-pull-row">
        <Download size={14} />
        <input
          type="text"
          className="hf-pull-input"
          value={hfInput}
          onChange={(e) => setHfInput(e.target.value)}
          placeholder="org/model — e.g. Qwen/Qwen2-VL-7B-Instruct"
          onKeyDown={(e) => e.key === "Enter" && handlePull()}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handlePull}
          disabled={pulling || !hfInput.trim()}
        >
          Pull from HF
        </button>
      </div>
      {pullMessage ? <p className="hf-pull-msg">{pullMessage}</p> : null}
    </div>
  );
}
