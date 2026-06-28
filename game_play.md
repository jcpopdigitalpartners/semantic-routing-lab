# Semantic Routing Lab — Gameplay Guide

A client-side simulation. No API keys, no real LLM calls. You tune a virtual LangGraph routing agent and chase the highest **run score**.

---

## Goal

**Write your way to peak efficiency.** Pick models for each route, run sample requests through your agent, read the score breakdown, swap models, and retry until you climb the tier ladder.

There is no cheat sheet — you discover what works by experimenting.

---

## How to start

1. Open the app and click **Play** on the Hub.
2. You land in the **Efficiency Challenge** lab (three columns: input · graph · scoreboard).

---

## The game loop

```
Pick a request  →  Assign models  →  Route request  →  Read score  →  Swap & retry
      ①                    ②              (graph)           ①–④
```

Repeat until you beat your **best run score** and clear the side challenges.

---

## Left column — step by step

### 1. Request inbox (factor ①)

Pick a **sample pill** or type a **custom prompt**.

Each sample implies a route the semantic router should choose:

| Input type | Examples | Router should pick |
|------------|----------|-------------------|
| PDF | Vendor contract, invoice scan | `pdf` |
| Spreadsheet | Q4 sales CSV, budget Excel | `spreadsheet` |
| Unstructured | Brainstorm, general Q&A | `unstructured` |

**Why this comes first:** you need to know *what* you're routing before you tune *who* handles it.

**Scoring:** correct route **+25 pts** · wrong route **+8 pts**.

---

### 2. Model roster (factor ②)

Assign one LLM per route from the dropdowns.

| Symbol | Meaning |
|--------|---------|
| **👁** | Multimodal — vision / document capable (strong for PDFs and scans) |
| **🤗** | Hugging Face model |
| **Fit %** | Predicted route match (factor ②) — a hint, not a guarantee |

**Pull from HF:** enter `org/model` (e.g. `Qwen/Qwen2-VL-7B-Instruct`) and click **Pull from HF**. Pulled models join your pool with stats inferred from the model name.

**Starting roster:** all three routes use `gpt-4o-mini` on purpose — cheap for chat, weak for PDF and spreadsheet. You should improve from there.

**Scoring:** model quality on the routed task × **35** (up to ~35 pts).

**Tips:**
- PDF route → Claude, Gemini, Docling, Qwen2-VL, InternVL2
- Spreadsheet route → GPT-4o, TableTransformer, Pixtral
- Unstructured route → fast cheap models (Haiku, GPT-4o mini) to protect speed and cost

---

### 3. Code editor (`router_agent.py`)

**What it is:** a readable **blueprint** of a real LangGraph routing agent in Python — state, embedding, router, conditional edges, and `ROUTE_MODELS`.

**What it is not:** executable code in this lab. Nothing runs on a server; the simulator drives results from your **request + roster**, not from Python execution.

**What it does:**
- **Gates runs** — **Route request** requires `StateGraph`, `embed_semantic`, `semantic_router`, and `add_conditional_edges` to still be present.
- **Syncs with roster** — when you change dropdowns, the `ROUTE_MODELS = { ... }` block updates automatically.
- **Teaches LangGraph** — the graph carousel code hints map each node to this file.

**To win the game:** focus on inbox + roster. You can leave the starter code unchanged.

---

### 4. Route request

Click **Route request** in the header.

Watch the **StateGraph** animate: ingest → embed → route → **one** LLM branch → metrics. Use the **overview carousel** below the graph to step through nodes.

Hover **Routed to LLM** in the editor toolbar after a run for a quick result summary and numbered score lines.

---

## Right column — reading your score

### Score formula: ① + ② + ③ − ④

Numbered badges on the UI match these factors:

| # | Factor | Where on screen | How it's scored |
|---|--------|-----------------|-----------------|
| **①** | Route match | Request inbox · accuracy ring/KPI | **+25** if correct · **+8** if wrong |
| **②** | Model fit | Roster fit % per route | quality × **35** (0–35 pts) |
| **③** | Speed–cost ratio | LLM latency KPI · efficiency ring · per-LLM bars | efficiency × **0.35** (0–35 pts) |
| **④** | Cost penalty | Session cost KPI | **−min(15, cost × 200)** |

After each run, the **Score formula** panel shows how many points you earned from each factor. Your **best run score** and **tier** persist in the browser (`localStorage`).

### Tiers

| Tier | Minimum best run score |
|------|------------------------|
| Bronze | 35 |
| Silver | 50 |
| Gold | 65 |
| Platinum | 80 |

### Side challenges

- Route all **6 sample inputs** with ≥80% accuracy
- **Pull** a custom model from Hugging Face
- Score **≥70 efficiency** on both a PDF and a spreadsheet run
- Keep session cost **under $0.05** across 4+ runs

### Efficiency Observatory

Session-level dashboard: routing rings, accuracy, latency, cost, and per-LLM efficiency bars. Use it to compare models across many runs; use the **Score formula** panel for per-run breakdown.

---

## Tradeoffs (the whole game)

| Choice | Helps | Hurts |
|--------|-------|-------|
| Big multimodal model on PDF | ② Model fit | ③ Speed · ④ Cost |
| Cheap mini model everywhere | ③ · ④ | ② on PDF/spreadsheet |
| Wrong route (bad sample match) | — | ① hard cap at +8 |
| HF vision model on PDF | ② | ③ latency |

There is no single winning roster — different requests reward different assignments.

---

## First session (~5 minutes)

1. Run **Vendor Contract PDF** with the default roster. Note a mediocre score (weak PDF fit).
2. Assign **Claude 3.5 Sonnet**, **Docling**, or **Qwen2-VL** to the **PDF** route. Run again — watch ② rise.
3. Run **Q4 Sales Spreadsheet**. Put **GPT-4o** or **TableTransformer** on the **spreadsheet** route.
4. Run **Unstructured Prompt**. Keep a cheap model on the **unstructured** route.
5. Check the formula panel after each run. Beat your **best run score**.

---

## What runs under the hood (simulation)

When you click **Route request**, the lab:

1. Scores the input against route centroids (semantic routing simulation).
2. Picks the winning route and the model **you assigned** to that route.
3. Computes quality from model–route affinity, latency and cost from model profiles, then applies the game formula above.

The graph visualization and step carousel reflect that simulated path — they mirror how a real LangGraph agent would flow, without calling external APIs.

---

## Quick reference

| I want to… | Do this |
|------------|---------|
| Raise ① | Pick samples that match their type; routing is automatic once the input is clear |
| Raise ② | Match multimodal/strong models to PDF; tabular models to spreadsheet |
| Raise ③ | Prefer faster models when fit is already good enough |
| Limit ④ | Avoid oversized models when a smaller one fits |
| Try a new model | HF pull field, or pick from the catalog (👁 = multimodal) |
| Reset progress | **Reset scores** in the lab header |
| Go back to overview | **Hub** in the lab header |

---

## Hub recap

The Hub shows tier targets, route types (you choose the models), and a preview of the efficiency dashboard. Pipeline on the Hub:

**Pick a request → Assign models → Route & read score → Swap & retry**

That matches the left column top-to-bottom: **Request inbox → Model roster → Code → Run**.
