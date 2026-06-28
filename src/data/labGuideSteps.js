/** In-app onboarding steps — order matches the game loop. */
export const LAB_GUIDE_STEPS = [
  {
    id: "inbox",
    target: "inbox",
    step: 1,
    title: "Pick a request",
    body: "Start here. Each sample is PDF, spreadsheet, or chat — the router must send it to the right path. This drives score factor ①.",
    hint: "Try Vendor Contract PDF first.",
  },
  {
    id: "roster",
    target: "roster",
    step: 2,
    title: "Assign your models",
    body: "Give each route an LLM. Fit % predicts factor ② — no cheat sheet; swap models until scores climb. 👁 = multimodal.",
    hint: "Defaults are weak on purpose — experiment.",
  },
  {
    id: "code",
    target: "code",
    step: 3,
    title: "Read the agent code",
    body: "router_agent.py is a LangGraph blueprint — StateGraph, embed, semantic_router, and conditional edges to three LLM branches. It does not execute here; it shows how a real agent is wired.",
    hint: "ROUTE_MODELS stays in sync when you change the roster dropdowns.",
  },
  {
    id: "run",
    target: "run",
    step: 4,
    title: "Route the request",
    body: "Click Route request when you're ready. The lab simulates routing from your inbox pick and roster — no API keys needed.",
    hint: "The graph and score panel come alive after this.",
  },
  {
    id: "graph",
    target: "graph",
    step: 5,
    title: "StateGraph",
    body: "This live graph shows the LangGraph pipeline. During a run, the active node pulses, the chosen LLM branch lights up, and skipped branches fade out.",
    hint: "Legend at the bottom lists your current roster per route.",
  },
  {
    id: "pipeline",
    target: "pipeline",
    step: 6,
    title: "Pipeline overview",
    body: "Before a run: intro slides explain ingest → embed → route → branch → metrics. After a run: carousel syncs with the graph so you can step node-by-node and read RouterState deltas.",
    hint: "Use ◀ ▶ or the dots to move through slides.",
  },
  {
    id: "score",
    target: "score",
    step: 7,
    title: "Read your score",
    body: "Right column: ① + ② + ③ − ④ = run score. Beat your best tier and retry with a new roster.",
    hint: "Hover Routed to LLM after a run for the breakdown.",
  },
];

export const GUIDANCE_STORAGE_KEY = "semantic-routing-lab-guidance-v3";

export function isGuidanceDone() {
  try {
    return localStorage.getItem(GUIDANCE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuidanceDone() {
  try {
    localStorage.setItem(GUIDANCE_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearGuidanceDone() {
  try {
    localStorage.removeItem(GUIDANCE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
