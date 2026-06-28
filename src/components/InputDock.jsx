import { FileText, MessageSquare, Table2, Upload } from "lucide-react";
import { SAMPLE_INPUTS } from "../data/samples.js";
import ScoreFactorBadge from "./ScoreFactorBadge.jsx";

const ICONS = { FileText, Table2, MessageSquare };

export default function InputDock({ selectedId, onSelect, customPrompt, onCustomPromptChange }) {
  return (
    <div className="input-dock">
      <div className="input-dock-row">
        <span className="input-dock-label">
          <Upload size={14} aria-hidden="true" />
          Request inbox
          <ScoreFactorBadge factorId={1} />
        </span>

        <div className="sample-row" role="listbox" aria-label="Sample requests">
          {SAMPLE_INPUTS.map((sample) => {
            const Icon = ICONS[sample.icon] || MessageSquare;
            const active = selectedId === sample.id;

            return (
              <button
                key={sample.id}
                type="button"
                role="option"
                aria-selected={active}
                title={`${sample.label} (${sample.kind})`}
                className={`sample-chip kind-${sample.kind} ${active ? "active" : ""}`}
                onClick={() => onSelect(sample.id)}
              >
                <Icon size={12} />
                <span className="sample-chip-label">{sample.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="custom-prompt-row">
        <span className="custom-prompt-label">Custom prompt</span>
        <textarea
          className="custom-prompt-input"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="e.g. Summarize the quarterly revenue spreadsheet and flag anomalies…"
          rows={3}
        />
      </label>
    </div>
  );
}
