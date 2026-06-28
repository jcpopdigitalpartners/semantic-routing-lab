export const LAB_META = {
  title: "Semantic Routing Lab",
  tagline: "Write your way to the best efficiency score",
  description:
    "You choose the LLMs — API models or ones you pull from Hugging Face. Assign a model to each route, run requests through your LangGraph agent, and climb the efficiency board. No cheat sheet: experiment until routing accuracy, quality, and cost align.",
};

export const ROUTE_PROFILES = {
  pdf: {
    route: "pdf",
    description: "PDF documents, scanned reports, contracts, invoices",
    anchors: [
      "pdf", "document", "page", "contract", "invoice", "extract", "scan",
      "report", "clause", "signature", "appendix", "terms", "agreement",
      "lease", "policy document", "whitepaper", "manuscript",
    ],
    fileExtensions: [".pdf"],
    mimeTypes: ["application/pdf"],
  },
  spreadsheet: {
    route: "spreadsheet",
    description: "CSV, Excel, tabular data, formulas, aggregations",
    anchors: [
      "csv", "excel", "xlsx", "spreadsheet", "column", "row", "pivot",
      "formula", "aggregate", "sum", "vlookup", "table", "dataset",
      "revenue", "forecast", "quarterly", "metrics", "sales data",
    ],
    fileExtensions: [".csv", ".xlsx", ".xls", ".tsv"],
    mimeTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  unstructured: {
    route: "unstructured",
    description: "Free-form prompts, chat, brainstorming, general Q&A",
    anchors: [
      "explain", "summarize", "what is", "how do", "write", "brainstorm",
      "help me", "draft", "compare", "opinion", "idea", "general",
      "question", "tell me", "describe", "why does",
    ],
    fileExtensions: [],
    mimeTypes: ["text/plain"],
  },
};

export const GRAPH_NODES = [
  { id: "ingest", label: "ingest_input", type: "entry", x: 50, y: 8 },
  { id: "features", label: "extract_features", type: "process", x: 50, y: 22 },
  { id: "embed", label: "embed_semantic", type: "process", x: 50, y: 36 },
  { id: "router", label: "semantic_router", type: "router", x: 50, y: 50 },
  { id: "pdf_llm", label: "pdf_llm", type: "llm", route: "pdf", x: 18, y: 72 },
  { id: "sheet_llm", label: "spreadsheet_llm", type: "llm", route: "spreadsheet", x: 50, y: 72 },
  { id: "general_llm", label: "general_llm", type: "llm", route: "unstructured", x: 82, y: 72 },
  { id: "metrics", label: "record_metrics", type: "exit", x: 50, y: 90 },
];

export const GRAPH_EDGES = [
  { from: "ingest", to: "features" },
  { from: "features", to: "embed" },
  { from: "embed", to: "router" },
  { from: "router", to: "pdf_llm", label: "pdf" },
  { from: "router", to: "sheet_llm", label: "spreadsheet" },
  { from: "router", to: "general_llm", label: "unstructured" },
  { from: "pdf_llm", to: "metrics" },
  { from: "sheet_llm", to: "metrics" },
  { from: "general_llm", to: "metrics" },
];

export const STARTER_CODE = `from typing import Literal, TypedDict
from langgraph.graph import END, StateGraph
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

class RouterState(TypedDict):
    input_text: str
    input_kind: str
    embedding: list[float]
    route: str
    route_scores: dict
    response: str
    metrics: dict

# YOU configure models — swap until efficiency scores climb
ROUTE_MODELS = {
    "pdf": "gpt-4o-mini",
    "spreadsheet": "gpt-4o-mini",
    "unstructured": "gpt-4o-mini",
}

def load_llm(model_id: str):
    if model_id.startswith("meta-llama/") or "/" in model_id:
        return ChatHuggingFace(llm=HuggingFaceEndpoint(repo_id=model_id))
    if "claude" in model_id:
        return ChatAnthropic(model=model_id, temperature=0)
    return ChatOpenAI(model=model_id, temperature=0)

ROUTE_LLMS = {route: load_llm(mid) for route, mid in ROUTE_MODELS.items()}

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

def ingest_input(state: RouterState) -> RouterState:
    return state

def embed_semantic(state: RouterState) -> RouterState:
    vector = embeddings.embed_query(state["input_text"])
    return {**state, "embedding": vector}

def semantic_router(state: RouterState) -> RouterState:
    # cosine similarity vs route centroids → state["route"]
    ...

def route_condition(state: RouterState) -> Literal["pdf_llm", "spreadsheet_llm", "general_llm"]:
    return {"pdf": "pdf_llm", "spreadsheet": "spreadsheet_llm", "unstructured": "general_llm"}[state["route"]]

graph = StateGraph(RouterState)
graph.add_node("ingest_input", ingest_input)
graph.add_node("embed_semantic", embed_semantic)
graph.add_node("semantic_router", semantic_router)
graph.add_node("pdf_llm", lambda s: invoke(s, ROUTE_LLMS["pdf"]))
graph.add_node("spreadsheet_llm", lambda s: invoke(s, ROUTE_LLMS["spreadsheet"]))
graph.add_node("general_llm", lambda s: invoke(s, ROUTE_LLMS["unstructured"]))
graph.add_node("record_metrics", record_metrics)

graph.set_entry_point("ingest_input")
graph.add_edge("ingest_input", "embed_semantic")
graph.add_edge("embed_semantic", "semantic_router")
graph.add_conditional_edges("semantic_router", route_condition)
graph.add_edge("pdf_llm", "record_metrics")
graph.add_edge("spreadsheet_llm", "record_metrics")
graph.add_edge("general_llm", "record_metrics")
graph.add_edge("record_metrics", END)

router_agent = graph.compile()`;
