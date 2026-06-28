export const NODE_GUIDE = {
  ingest: {
    title: "Ingest input",
    phase: "Entry",
    summary: "The graph receives raw user input — file metadata plus the prompt — and normalizes it into RouterState.",
    occurs: "LangGraph calls this node first via set_entry_point(). It does not call an LLM; it prepares state for downstream nodes.",
    stateReads: [],
    stateWrites: ["input_text", "input_kind", "filename", "mime_type"],
    codeHint: "graph.set_entry_point(\"ingest_input\")",
  },
  features: {
    title: "Extract features",
    phase: "Pre-routing",
    summary: "Derive routing priors from file extension, MIME type, and token count before embedding.",
    occurs: "Strong signals like .pdf or text/csv boost the matching route score — cheap heuristics before the embedding API call.",
    stateReads: ["input_text", "filename", "mime_type"],
    stateWrites: ["has_file", "extension", "token_estimate"],
    codeHint: "Optional node — many teams inline this inside ingest_input",
  },
  embed: {
    title: "Embed semantic",
    phase: "Pre-routing",
    summary: "Convert the normalized text into a dense vector using an embedding model.",
    occurs: "OpenAI text-embedding-3-small (1536 dims) captures meaning beyond keywords — \"payment terms\" clusters near pdf centroids.",
    stateReads: ["input_text"],
    stateWrites: ["embedding"],
    codeHint: "embeddings.embed_query(state[\"input_text\"])",
  },
  router: {
    title: "Semantic router",
    phase: "Branch",
    summary: "Compare the query embedding to precomputed route centroids and pick the highest-scoring path.",
    occurs: "add_conditional_edges() reads state[\"route\"] and fires exactly one LLM branch — pdf, spreadsheet, or unstructured.",
    stateReads: ["embedding"],
    stateWrites: ["route", "route_scores", "confidence"],
    codeHint: "graph.add_conditional_edges(\"semantic_router\", route_condition)",
  },
  pdf_llm: {
    title: "PDF route LLM",
    phase: "Execute",
    summary: "Whatever model you assigned to the pdf route — runs only when the router selects pdf.",
    occurs: "Quality and efficiency depend on route fit. Swap models in your roster and re-run to compare scores.",
    stateReads: ["input_text", "route"],
    stateWrites: ["response", "tokens_in", "tokens_out", "cost_usd"],
    codeHint: "ROUTE_LLMS[\"pdf\"]  # your choice",
  },
  sheet_llm: {
    title: "Spreadsheet route LLM",
    phase: "Execute",
    summary: "Your spreadsheet-route model — tabular prompts land here.",
    occurs: "Try API models or Hugging Face pulls with table/code keywords for higher fit scores.",
    stateReads: ["input_text", "route"],
    stateWrites: ["response", "tokens_in", "tokens_out", "cost_usd"],
    codeHint: "ROUTE_LLMS[\"spreadsheet\"]",
  },
  general_llm: {
    title: "Unstructured route LLM",
    phase: "Execute",
    summary: "Your chat/Q&A model — free-form prompts route here.",
    occurs: "Smaller instruct models often win on cost; larger models on quality — you discover the tradeoff.",
    stateReads: ["input_text", "route"],
    stateWrites: ["response", "tokens_in", "tokens_out", "cost_usd"],
    codeHint: "ROUTE_LLMS[\"unstructured\"]",
  },
  metrics: {
    title: "Record metrics",
    phase: "Exit",
    summary: "Persist routing accuracy, latency, cost, quality, and your game score.",
    occurs: "Each run adds to the efficiency board. Beat your best by tuning the roster — not by following a cheat sheet.",
    stateReads: ["route", "response", "cost_usd"],
    stateWrites: ["routing_correct", "total_latency_ms", "quality_score", "game_score"],
    codeHint: "graph.add_edge(\"record_metrics\", END)",
  },
};

export const PIPELINE_OVERVIEW = {
  title: "StateGraph overview",
  description:
    "A LangGraph agent is a directed graph of nodes. Each node is a Python function that reads and writes shared RouterState. Conditional edges branch based on state — here, semantic similarity picks which specialist LLM runs.",
  legs: [
    { label: "Pre-routing chain", nodes: ["ingest", "features", "embed", "router"] },
    { label: "Conditional branch", nodes: ["pdf_llm", "sheet_llm", "general_llm"] },
    { label: "Converge & exit", nodes: ["metrics"] },
  ],
};

export const OVERVIEW_INTRO_SLIDES = [
  {
    id: "intro",
    phase: "Overview",
    title: "StateGraph overview",
    summary:
      "A LangGraph agent is a directed graph of nodes. Each node reads and writes shared RouterState — your agent's memory for a single run.",
    occurs:
      "Unlike a linear chain, branches fire conditionally. Here, semantic similarity picks which specialist LLM handles the request.",
    codeHint: "router_agent = graph.compile()",
  },
  {
    id: "pre-routing",
    phase: "Leg 1",
    title: "Pre-routing chain",
    summary: "Four nodes run in sequence before any LLM is called — ingest, feature extract, embed, route.",
    occurs:
      "Every request walks this chain. Embedding cost is paid once; routing is a cheap cosine comparison against route centroids.",
    codeHint: "ingest → extract_features → embed_semantic → semantic_router",
  },
  {
    id: "branch",
    phase: "Leg 2",
    title: "Conditional branch",
    summary: "Exactly one route LLM runs — pdf, spreadsheet, or unstructured — based on your roster and the router score.",
    occurs:
      "You assign models in the roster panel. Wrong fit costs quality points; expensive models cost efficiency — experiment to climb tiers.",
    codeHint: "graph.add_conditional_edges(\"semantic_router\", route_condition)",
  },
  {
    id: "exit",
    phase: "Leg 3",
    title: "Converge & exit",
    summary: "All branches merge at record_metrics before END — logging accuracy, latency, and cost.",
    occurs:
      "Production agents push these metrics to LangSmith, Datadog, or a dashboard like the Efficiency Observatory on the right.",
    codeHint: "graph.add_edge(\"record_metrics\", END)",
  },
];

export function getNodeGuide(nodeId) {
  return NODE_GUIDE[nodeId] ?? null;
}
