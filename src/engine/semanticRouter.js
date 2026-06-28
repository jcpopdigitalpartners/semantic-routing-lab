import { ROUTE_PROFILES } from "../data/config.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "to", "in", "on", "for", "of", "this", "that",
  "is", "are", "with", "from", "by", "at", "it", "be", "as", "me", "my", "show",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s._%-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function buildProfileVector(anchors) {
  const freq = {};
  for (const anchor of anchors) {
    for (const token of tokenize(anchor)) {
      freq[token] = (freq[token] || 0) + 1;
    }
  }
  return freq;
}

const PROFILE_VECTORS = Object.fromEntries(
  Object.entries(ROUTE_PROFILES).map(([key, profile]) => [
    key,
    buildProfileVector(profile.anchors),
  ])
);

function cosineFromFreq(queryTokens, profileFreq) {
  const queryFreq = {};
  for (const t of queryTokens) {
    queryFreq[t] = (queryFreq[t] || 0) + 1;
  }

  const allKeys = new Set([...Object.keys(queryFreq), ...Object.keys(profileFreq)]);
  let dot = 0;
  let normQ = 0;
  let normP = 0;

  for (const key of allKeys) {
    const q = queryFreq[key] || 0;
    const p = profileFreq[key] || 0;
    dot += q * p;
    normQ += q * q;
    normP += p * p;
  }

  if (normQ === 0 || normP === 0) return 0;
  return dot / (Math.sqrt(normQ) * Math.sqrt(normP));
}

function extensionBoost(filename, profile) {
  if (!filename) return 0;
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return profile.fileExtensions.includes(ext) ? 0.35 : 0;
}

function mimeBoost(mimeType, profile) {
  if (!mimeType) return 0;
  return profile.mimeTypes.includes(mimeType) ? 0.25 : 0;
}

function kindBoost(declaredKind, routeKey) {
  return declaredKind === routeKey ? 0.15 : 0;
}

export function scoreRoutes(input) {
  const text = [input.prompt, input.preview, input.filename].filter(Boolean).join(" ");
  const tokens = tokenize(text);

  const scores = {};
  for (const [routeKey, profile] of Object.entries(ROUTE_PROFILES)) {
    const semantic = cosineFromFreq(tokens, PROFILE_VECTORS[routeKey]);
    const boost =
      extensionBoost(input.filename, profile) +
      mimeBoost(input.mimeType, profile) +
      kindBoost(input.kind, routeKey);

    scores[routeKey] = Math.min(0.99, semantic + boost);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestRoute, bestScore] = sorted[0];
  const runnerUp = sorted[1]?.[1] ?? 0;

  return {
    route: bestRoute,
    scores,
    confidence: Math.max(0.5, bestScore - runnerUp + 0.55),
    tokens: tokens.slice(0, 12),
  };
}

export function buildEmbeddingPreview(tokens) {
  const dims = 8;
  return Array.from({ length: dims }, (_, i) => {
    const seed = tokens.reduce((acc, t, j) => acc + t.charCodeAt(0) * (j + 1), i * 17);
    return Number(((Math.sin(seed) + 1) / 2).toFixed(3));
  });
}
