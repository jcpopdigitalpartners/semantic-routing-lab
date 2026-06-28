import { motion } from "framer-motion";
import { GRAPH_EDGES, GRAPH_NODES } from "../data/config.js";
import { ROUTE_META } from "../data/models.js";

function Edge({ from, to, label, completedNodes, currentNode, branchTaken, activeRoute }) {
  const fromNode = GRAPH_NODES.find((n) => n.id === from);
  const toNode = GRAPH_NODES.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const fromDone = completedNodes.includes(from);
  const toDone = completedNodes.includes(to);
  const isCurrentEdge =
    currentNode === from ||
    (from === "router" && completedNodes.includes("router") && to === branchTaken);

  const isBranchEdge = from === "router";
  const branchLit =
    isBranchEdge &&
    branchTaken === to &&
    completedNodes.includes("router");

  const dimBranch =
    isBranchEdge &&
    branchTaken &&
    branchTaken !== to &&
    completedNodes.includes("router");

  const lit = (fromDone && toDone) || branchLit || (isCurrentEdge && !isBranchEdge);

  return (
    <g opacity={dimBranch ? 0.15 : 1}>
      <motion.line
        x1={`${fromNode.x}%`}
        y1={`${fromNode.y}%`}
        x2={`${toNode.x}%`}
        y2={`${toNode.y}%`}
        stroke={lit ? "#c4b5fd" : "#2a2540"}
        strokeWidth={lit ? 2.5 : 1.5}
        strokeDasharray={label && !branchLit ? "6 4" : "none"}
        animate={{ opacity: lit ? 1 : 0.35 }}
        transition={{ duration: 0.3 }}
      />
      {label && branchLit ? (
        <text
          x={`${(fromNode.x + toNode.x) / 2}%`}
          y={`${(fromNode.y + toNode.y) / 2 - 1}%`}
          fill="#22d3ee"
          fontSize="9"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export default function LangGraphCanvas({
  currentNode,
  completedNodes = [],
  activeRoute,
  branchTaken,
  running,
  rosterProfiles = {},
}) {
  const llmFromRoute = activeRoute
    ? { pdf: "pdf_llm", spreadsheet: "sheet_llm", unstructured: "general_llm" }[activeRoute]
    : null;
  const resolvedBranch = branchTaken ?? llmFromRoute;

  return (
    <div className="graph-canvas">
      <div className="graph-canvas-head">
        <span>StateGraph</span>
        <span className={`graph-status ${running ? "live" : ""}`}>
          {running ? "● executing" : currentNode ? "◉ step mode" : "○ idle"}
        </span>
      </div>

      <svg viewBox="0 0 400 360" className="graph-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeGlowCurrent" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        {GRAPH_EDGES.map((edge) => (
          <Edge
            key={`${edge.from}-${edge.to}`}
            {...edge}
            completedNodes={completedNodes}
            currentNode={currentNode}
            branchTaken={resolvedBranch}
            activeRoute={activeRoute}
          />
        ))}

        {GRAPH_NODES.map((node) => {
          const llmIds = ["pdf_llm", "sheet_llm", "general_llm"];
          const isSkippedBranch =
            llmIds.includes(node.id) && resolvedBranch && node.id !== resolvedBranch && completedNodes.includes("router");

          if (isSkippedBranch) {
            return (
              <g key={node.id} opacity={0.2}>
                <rect
                  x={node.x * 4 - 36}
                  y={node.y * 3.6 - 14}
                  width={72}
                  height={28}
                  rx={8}
                  fill="#12101c"
                  stroke="#2a2540"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <text
                  x={node.x * 4}
                  y={node.y * 3.6 + 4}
                  fill="#4a4560"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  skipped
                </text>
              </g>
            );
          }

          const isCurrent = currentNode === node.id;
          const isCompleted = completedNodes.includes(node.id) && !isCurrent;
          const isLlm = node.type === "llm";
          const routeMeta = isLlm ? ROUTE_META[node.route] : null;
          const assigned = isLlm ? rosterProfiles[node.route] : null;
          const color = assigned?.color ?? routeMeta?.color ?? "#7c3aed";
          const glow = assigned?.glow ?? routeMeta?.glow ?? "rgba(167,139,250,0.5)";
          const cx = node.x * 4;
          const cy = node.y * 3.6;

          return (
            <g key={node.id}>
              {isCurrent ? (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isLlm ? 32 : 26}
                  fill="url(#nodeGlowCurrent)"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              ) : isCompleted ? (
                <circle cx={cx} cy={cy} r={isLlm ? 26 : 22} fill="url(#nodeGlow)" opacity={0.5} />
              ) : null}
              <motion.rect
                x={cx - (isLlm ? 36 : 30)}
                y={cy - 14}
                width={isLlm ? 72 : 60}
                height={28}
                rx={8}
                fill={
                  isCurrent
                    ? color
                    : isCompleted
                      ? "#1a1830"
                      : "#12101c"
                }
                stroke={
                  isCurrent
                    ? color
                    : isCompleted
                      ? color
                      : "#2a2540"
                }
                strokeWidth={isCurrent ? 2.5 : isCompleted ? 1.5 : 1}
                animate={{
                  filter: isCurrent
                    ? `drop-shadow(0 0 12px ${glow})`
                    : "none",
                }}
                transition={{ duration: 0.25 }}
              />
              <text
                x={cx}
                y={cy + 4}
                fill={isCurrent ? "#0a0a12" : isCompleted ? "#c4b5fd" : "#8b85a8"}
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.label.length > 14 ? node.label.slice(0, 12) + "…" : node.label}
              </text>
              {isCurrent ? (
                <text
                  x={cx}
                  y={cy + 22}
                  fill="#22d3ee"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="700"
                >
                  ▶ HERE
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="graph-legend">
        {Object.entries(rosterProfiles).map(([route, m]) => (
          <span key={route} className="graph-legend-item">
            <i style={{ background: m.color }} />
            {route}: {m.displayName?.slice(0, 18) ?? m.model}
          </span>
        ))}
        <span className="graph-legend-item"><i className="legend-current" /> current</span>
      </div>
    </div>
  );
}
