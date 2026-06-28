import { MODEL_CATALOG, ROUTE_META } from "../data/models.js";

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(n, min = 0, max = 0.99) {
  return Math.min(max, Math.max(min, n));
}

function inferMultimodal(modelId) {
  const lower = modelId.toLowerCase();
  return /vision|vl-|vl_|-vl|llava|idefics|pixtral|internvl|cogvlm|fuyu|florence|layoutlm|donut|nougat|docling|multimodal|onevision|moondream|minicpm-v|qwen2-vl|phi-3-vision|gemini|gpt-4o|gpt-4-turbo|claude-3|table.?transform|ocr|image-text|mm-/i.test(
    lower
  );
}

function inferAffinity(modelId) {
  const lower = modelId.toLowerCase();
  let pdf = 0.52;
  let spreadsheet = 0.52;
  let unstructured = 0.58;

  if (/doc|pdf|layout|ocr|donut|nougat|docling|layoutlm|florence/.test(lower)) pdf += 0.35;
  if (/vision|vl|llava|idefics|pixtral|internvl|cogvlm|fuyu|onevision|qwen2-vl|phi-3-vision|moondream|minicpm-v|multimodal/.test(lower)) {
    pdf += 0.28;
    unstructured += 0.10;
  }
  if (/table|tabular|csv|excel|sheet|sql|code|starcoder|deepseek-coder|wizardcoder/.test(lower)) {
    spreadsheet += 0.32;
  }
  if (/llama|mistral|phi|gemma|qwen|chat|instruct|zephyr|vicuna|openchat/.test(lower)) {
    unstructured += 0.28;
  }
  if (/mini|small|tiny|1b|3b/.test(lower)) {
    pdf -= 0.12;
    spreadsheet -= 0.08;
  }
  if (/70b|405b|large|pro|sonnet|gpt-4/.test(lower)) {
    pdf += 0.08;
    spreadsheet += 0.06;
  }

  const h = hashString(modelId);
  pdf += (h % 17) / 100 - 0.08;
  spreadsheet += ((h >> 4) % 17) / 100 - 0.08;
  unstructured += ((h >> 8) % 17) / 100 - 0.08;

  return {
    pdf: clamp(pdf),
    spreadsheet: clamp(spreadsheet),
    unstructured: clamp(unstructured),
  };
}

/** Simulate pulling a model from Hugging Face Hub — deterministic stats from model id. */
export function pullHuggingFaceModel(modelId) {
  const trimmed = modelId.trim();
  if (!trimmed) return { ok: false, message: "Enter a Hugging Face model id (e.g. meta-llama/Meta-Llama-3-8B-Instruct)" };
  if (!/^[\w.-]+\/[\w.-]+/.test(trimmed) && !/^[\w.-]+$/.test(trimmed)) {
    return { ok: false, message: "Use org/model format — e.g. mistralai/Mistral-7B-Instruct-v0.3" };
  }

  const fullId = trimmed.includes("/") ? trimmed : `community/${trimmed}`;
  const h = hashString(fullId);
  const shortName = fullId.split("/").pop();
  const affinity = inferAffinity(fullId);

  const model = {
    id: `hf:${fullId}`,
    model: fullId,
    displayName: shortName,
    provider: "Hugging Face",
    source: "huggingface",
    multimodal: inferMultimodal(fullId),
    modalities: inferMultimodal(fullId) ? ["text", "image"] : ["text"],
    baseLatencyMs: 800 + (h % 900),
    latencyJitterMs: 120 + (h % 180),
    costPer1kTokens: 0.00003 + (h % 50) / 200000,
    avgTokensIn: 600 + (h % 3000),
    avgTokensOut: 200 + (h % 500),
    affinity,
    pulledAt: Date.now(),
  };

  return { ok: true, model };
}

export function createModelRegistry(initialPool = MODEL_CATALOG) {
  const pool = new Map(initialPool.map((m) => [m.id, { ...m }]));

  return {
    getPool: () => Array.from(pool.values()),
    getModel: (id) => pool.get(id) ?? pool.get(id?.replace(/^hf:/, "")) ?? null,
    getByModelString: (modelStr) => {
      for (const m of pool.values()) {
        if (m.model === modelStr || m.id === modelStr) return m;
      }
      return null;
    },
    addModel(model) {
      pool.set(model.id, { ...model });
      return model;
    },
    pullHf(modelId) {
      const result = pullHuggingFaceModel(modelId);
      if (!result.ok) return result;
      if (pool.has(result.model.id)) {
        return { ok: true, model: pool.get(result.model.id), duplicate: true };
      }
      pool.set(result.model.id, result.model);
      return { ok: true, model: result.model, duplicate: false };
    },
  };
}

export function resolveRosterModel(registry, modelIdOrKey) {
  return (
    registry.getModel(modelIdOrKey) ??
    registry.getByModelString(modelIdOrKey) ??
    MODEL_CATALOG.find((m) => m.id === modelIdOrKey || m.model === modelIdOrKey)
  );
}

export function buildRosterProfiles(registry, roster) {
  const profiles = {};
  for (const [route, modelKey] of Object.entries(roster)) {
    const meta = ROUTE_META[route];
    const model = resolveRosterModel(registry, modelKey);
    if (!model || !meta) continue;
    profiles[route] = {
      ...model,
      route,
      label: model.displayName,
      color: meta.color,
      glow: meta.glow,
      routeFit: model.affinity?.[route] ?? 0.5,
    };
  }
  return profiles;
}

export function computeRunQuality(model, route, routingCorrect) {
  const fit = model.affinity?.[route] ?? 0.5;
  const routeBonus = routingCorrect ? 0.06 : -0.12;
  const jitter = (Math.random() - 0.5) * 0.06;
  return clamp(fit + routeBonus + jitter, 0.25, 0.99);
}

export function computeEfficiencyScore(quality, costUsd, latencyMs) {
  const raw = (quality / (costUsd * 120 + latencyMs / 900)) * 22;
  return Math.min(100, Math.round(raw * 10) / 10);
}

export function computeGameScore(result) {
  return getGameScoreBreakdown(result).total;
}

export function getGameScoreBreakdown(result) {
  const routingPts = result.routingCorrect ? 25 : 8;
  const qualityPts = Math.round(result.qualityScore * 35 * 10) / 10;
  const efficiencyPts = Math.round((result.efficiencyScore ?? 0) * 0.35 * 10) / 10;
  const costPenalty = Math.min(15, Math.round(result.costUsd * 200 * 10) / 10);
  const total = Math.max(0, Math.round(routingPts + qualityPts + efficiencyPts - costPenalty));

  return {
    total,
    factors: [
      { id: 1, pts: routingPts, raw: result.routingCorrect },
      { id: 2, pts: qualityPts, raw: result.qualityScore },
      { id: 3, pts: efficiencyPts, raw: result.efficiencyScore ?? 0 },
      { id: 4, pts: -costPenalty, raw: result.costUsd },
    ],
  };
}

export function rosterFitPreview(registry, roster) {
  return Object.entries(roster).map(([route, modelKey]) => {
    const model = resolveRosterModel(registry, modelKey);
    return {
      route,
      model: model?.displayName ?? modelKey,
      fit: model?.affinity?.[route] ?? 0,
    };
  });
}
