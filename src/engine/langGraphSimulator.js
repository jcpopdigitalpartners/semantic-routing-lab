import { ROUTE_META } from "../data/models.js";
import {
  buildRosterProfiles,
  computeEfficiencyScore,
  computeGameScore,
  computeRunQuality,
  getGameScoreBreakdown,
} from "./modelRegistry.js";
import { buildEmbeddingPreview, scoreRoutes } from "./semanticRouter.js";

function jitter(base, range) {
  return base + Math.round((Math.random() - 0.5) * range * 2);
}

function estimateCost(model, tokensIn, tokensOut) {
  return ((tokensIn + tokensOut) / 1000) * model.costPer1kTokens;
}

function buildLlmResponse(route, input, model) {
  const fit = model.affinity?.[route] ?? 0.5;
  const qualityNote =
    fit >= 0.85 ? "Strong route fit — crisp structured output." :
    fit >= 0.65 ? "Acceptable output with minor gaps." :
    "Weak fit for this modality — consider swapping models in your roster.";

  const bodies = {
    pdf: `Parsed ${input.filename || "document"} with ${model.displayName}. ${qualityNote}`,
    spreadsheet: `Analyzed ${input.filename || "dataset"} with ${model.displayName}. ${qualityNote}`,
    unstructured: `${model.displayName} draft: ${input.prompt.slice(0, 60)}… ${qualityNote}`,
  };
  return bodies[route];
}

/** Build all graph steps synchronously with cumulative RouterState snapshots. */
export function buildLangGraphSteps(input, roster, registry) {
  const rosterProfiles = buildRosterProfiles(registry, roster);
  const t0 = performance.now();
  const routing = scoreRoutes(input);
  const embedding = buildEmbeddingPreview(routing.tokens);
  const routingLatencyMs = Math.round(performance.now() - t0 + 740);

  const llmNodeId = {
    pdf: "pdf_llm",
    spreadsheet: "sheet_llm",
    unstructured: "general_llm",
  }[routing.route];

  const model = rosterProfiles[routing.route];
  if (!model) {
    throw new Error(`No model assigned to route: ${routing.route}`);
  }

  const tokensIn = jitter(model.avgTokensIn, 400);
  const tokensOut = jitter(model.avgTokensOut, 120);
  const llmLatencyMs = jitter(model.baseLatencyMs, model.latencyJitterMs);
  const cost = estimateCost(model, tokensIn, tokensOut);
  const quality = computeRunQuality(model, routing.route, routing.route === input.kind);
  const efficiencyScore = computeEfficiencyScore(quality, cost, llmLatencyMs);
  const response = buildLlmResponse(routing.route, input, model);

  let state = {
    input_text: [input.prompt, input.preview].filter(Boolean).join("\n"),
    input_kind: input.kind,
    filename: input.filename ?? null,
    mime_type: input.mimeType ?? null,
  };

  const steps = [];

  const push = (step, statePatch) => {
    const stateBefore = { ...state };
    state = { ...state, ...statePatch };
    steps.push({
      ...step,
      stateBefore,
      stateAfter: { ...state },
      stateDelta: statePatch,
    });
  };

  push(
    {
      id: "ingest",
      node: "ingest_input",
      label: "ingest_input",
      type: "entry",
      stepIndex: 0,
      content: {
        filename: input.filename,
        mimeType: input.mimeType,
        prompt: input.prompt,
        declaredKind: input.kind,
      },
      insight: "LangGraph entry node — normalize metadata + user prompt into RouterState.",
    },
    {
      input_text: state.input_text,
      input_kind: input.kind,
      filename: input.filename,
      mime_type: state.mime_type,
    }
  );

  push(
    {
      id: "features",
      node: "extract_features",
      label: "extract_features",
      type: "process",
      stepIndex: 1,
      content: {
        hasFile: Boolean(input.filename),
        extension: input.filename?.split(".").pop() ?? "none",
        tokenEstimate: input.prompt.split(/\s+/).length + (input.preview?.split(/\s+/).length ?? 0),
      },
      insight: "Feature extraction boosts routing — file extension and MIME type are strong priors.",
    },
    {
      has_file: Boolean(input.filename),
      extension: input.filename?.split(".").pop() ?? "none",
      token_estimate:
        input.prompt.split(/\s+/).length + (input.preview?.split(/\s+/).length ?? 0),
    }
  );

  push(
    {
      id: "embed",
      node: "embed_semantic",
      label: "embed_semantic",
      type: "process",
      stepIndex: 2,
      content: {
        model: "text-embedding-3-small",
        dimensions: 1536,
        preview: embedding,
        topTokens: routing.tokens,
      },
      insight: "Embedding captures semantic intent — similar prompts cluster near route centroids.",
    },
    { embedding: `[${embedding.join(", ")}, … ×1536]` }
  );

  push(
    {
      id: "router",
      node: "semantic_router",
      label: "semantic_router",
      type: "router",
      stepIndex: 3,
      content: {
        selectedRoute: routing.route,
        confidence: routing.confidence.toFixed(3),
        scores: Object.fromEntries(
          Object.entries(routing.scores).map(([k, v]) => [k, v.toFixed(3)])
        ),
        conditionalEdge: `${routing.route} → ${llmNodeId}`,
        assignedModel: model.model,
      },
      insight: `Your roster dispatches ${ROUTE_META[routing.route]?.label} → ${model.displayName}.`,
      route: routing.route,
      branchTaken: llmNodeId,
    },
    {
      route: routing.route,
      route_scores: Object.fromEntries(
        Object.entries(routing.scores).map(([k, v]) => [k, Number(v.toFixed(3))])
      ),
      confidence: Number(routing.confidence.toFixed(3)),
    }
  );

  push(
    {
      id: llmNodeId,
      node: llmNodeId,
      label: llmNodeId,
      type: "llm",
      stepIndex: 4,
      route: routing.route,
      content: {
        model: model.model,
        displayName: model.displayName,
        provider: model.provider,
        source: model.source,
        routeFit: (model.routeFit * 100).toFixed(0) + "%",
        latencyMs: llmLatencyMs,
        tokensIn,
        tokensOut,
        costUsd: cost.toFixed(4),
        responsePreview: response.slice(0, 100) + "…",
      },
      insight: `Route fit ${(model.routeFit * 100).toFixed(0)}% — swap models in your roster to climb the efficiency board.`,
    },
    {
      response,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: Number(cost.toFixed(4)),
      model: model.model,
    }
  );

  const totalLatencyMs = routingLatencyMs + llmLatencyMs;

  const result = {
    route: routing.route,
    expectedRoute: input.kind,
    routingCorrect: routing.route === input.kind,
    confidence: routing.confidence,
    scores: routing.scores,
    llm: model,
    tokensIn,
    tokensOut,
    routingLatencyMs,
    llmLatencyMs,
    totalLatencyMs,
    costUsd: cost,
    qualityScore: quality,
    efficiencyScore,
    routingEfficiency: routing.route === input.kind ? 1 : 0.35,
    llmEfficiency: efficiencyScore / 100,
    response,
    branchTaken: llmNodeId,
  };

  result.gameScore = computeGameScore(result);
  result.scoreBreakdown = getGameScoreBreakdown(result);

  push(
    {
      id: "metrics",
      node: "record_metrics",
      label: "record_metrics",
      type: "exit",
      stepIndex: 5,
      content: {
        routingCorrect: routing.route === input.kind,
        routingLatencyMs,
        llmLatencyMs,
        totalLatencyMs,
        costUsd: cost,
        qualityScore: quality,
        efficiencyScore,
        gameScore: result.gameScore,
      },
      insight: `Game score +${result.gameScore} — tune your roster and re-run to beat your best.`,
    },
    {
      routing_correct: routing.route === input.kind,
      routing_latency_ms: routingLatencyMs,
      llm_latency_ms: llmLatencyMs,
      total_latency_ms: totalLatencyMs,
      quality_score: quality,
      efficiency_score: efficiencyScore,
      game_score: result.gameScore,
    }
  );

  return { steps, result };
}

export async function playbackSteps(steps, onStep, intervalMs = 400) {
  for (let i = 0; i < steps.length; i += 1) {
    onStep(steps[i], i);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export function validateRouterCode(code) {
  const required = [
    /StateGraph/,
    /semantic_router/,
    /add_conditional_edges/,
    /embed_semantic/,
  ];
  const missing = required.filter((p) => !p.test(code));
  if (missing.length) {
    return { ok: false, message: "Wire up StateGraph, embed_semantic, semantic_router, and conditional edges." };
  }
  return { ok: true };
}

export function getCompletedNodeIds(steps, activeIndex) {
  if (activeIndex < 0 || !steps.length) return [];
  return steps.slice(0, activeIndex + 1).map((s) => s.id);
}

export function getActiveRouteFromStep(step) {
  if (!step) return null;
  if (step.route) return step.route;
  if (step.id === "pdf_llm") return "pdf";
  if (step.id === "sheet_llm") return "spreadsheet";
  if (step.id === "general_llm") return "unstructured";
  return null;
}

export function generateRosterCode(roster, pool) {
  const lines = Object.entries(roster).map(([route, id]) => {
    const m = pool.find((p) => p.id === id);
    return `    "${route}": "${m?.model ?? id}",`;
  });
  return `ROUTE_MODELS = {\n${lines.join("\n")}\n}`;
}
