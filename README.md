# Semantic Routing Lab

Interactive learning lab for building a **LangGraph semantic routing agent** that dispatches PDFs, spreadsheets, and unstructured prompts to specialist LLMs — with a live **Efficiency Observatory** dashboard.

## What you'll learn

- **Semantic routing** — embed user intent, score against route centroids, branch with `add_conditional_edges`
- **LangGraph StateGraph** — ingest → embed → route → specialist LLM → metrics
- **Multi-LLM architecture** — match modality to model (Claude for docs, GPT-4o for tabular, mini for chat)
- **Efficiency metrics** — routing accuracy, latency, cost, and per-model quality scores

## Quick start

```bash
cd semantic-routing-lab
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy to GitHub Pages

This app is static (Vite + React) and works on GitHub Pages with no backend.

1. Create a GitHub repo and push this project (`main` branch).
2. On the repo: **Settings → Pages → Build and deployment → Source** → choose **GitHub Actions**.
3. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually). The included workflow builds with the correct asset base path and publishes `dist/`.

Live URL (project site):

`https://<your-username>.github.io/semantic-routing-lab/`

If you rename the repo, the URL path matches the repo name. The workflow sets `VITE_BASE_PATH` automatically.

For a **user site** (`username.github.io` repo root), build locally with `VITE_BASE_PATH=/ npm run build` and adjust the workflow base to `/`.

See [game_play.md](./game_play.md) for how to play.

## How to use the lab

1. **Hub** — overview of the three specialist routes and pipeline
2. **Enter lab** — pick a sample request (PDF contract, sales spreadsheet, brainstorm prompt)
3. **Edit** `router_agent.py` — the LangGraph starter code (validation checks for key patterns)
4. **Route request** — watch the graph animate, trace each node, read the LLM response
5. **Dashboard** — routing efficiency rings, KPIs, per-LLM bars, and recent route feed update live

Try routing all six samples (or mix in custom prompts) to see accuracy and cost accumulate.

## Architecture

```
ingest_input → extract_features → embed_semantic → semantic_router
                                                        ├→ pdf_llm (claude-3-5-sonnet)
                                                        ├→ spreadsheet_llm (gpt-4o)
                                                        └→ general_llm (gpt-4o-mini)
                                                              → record_metrics
```

The browser simulates embedding similarity and LLM latency/cost — no API keys required. The Python editor shows production-ready LangGraph code you'd deploy with real embeddings and models.

## Stack

- React 19 + Vite
- Framer Motion (graph + dashboard animations)
- CodeMirror (Python editor)
- Client-side semantic router engine

## Build

```bash
npm run build
npm run preview
```
