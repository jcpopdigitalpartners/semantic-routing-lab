# Semantic Routing Lab — Gameplay Guide

A client-side simulation. No API keys, no real LLM calls. You tune a virtual LangGraph routing agent and chase the highest **run score**.

**Live demo:** https://jcpopdigitalpartners.github.io/semantic-routing-lab/

---

## Goal

**Write your way to peak efficiency.** Pick models for each route, run sample requests through your agent, read the score breakdown, swap models, and retry until you climb the tier ladder.

There is no cheat sheet — you discover what works by experimenting.

---

## How to start

1. Open the app and click **Play** on the Hub.
2. You land in the **Efficiency Challenge** lab (three columns: **input · graph · scoreboard**).
3. On your **first visit**, a **7-step guided tour** starts automatically — spotlight overlays walk you through every major area. Click **Next** through each step, or **Skip tour** / **Start playing** when ready.
4. Anytime later, click **Guide** in the lab header to replay the tour.

---

## In-app guided tour (7 steps)

The tour highlights each zone in order. Follow along on first launch:

| Step | Area | What you learn |
|------|------|----------------|
| 1 | **Request inbox** | Pick a sample — drives score factor ① |
| 2 | **Model roster** | Assign LLMs per route — factor ② fit % |
| 3 | **Code editor** | `router_agent.py` LangGraph blueprint (read-only simulation) |
| 4 | **Route request** | Run the simulated agent |
| 5 | **StateGraph** | Live node graph — active node, branch taken, skipped paths |
| 6 | **Pipeline overview** | Carousel: intro slides pre-run, synced node slides post-run |
| 7 | **Score panel** | Formula ① + ② + ③ − ④ and tier progress |

Tour completion is saved in your browser. To see it again: **Guide** button, or clear `semantic-routing-lab-guidance-v3` from site localStorage.

---

## The game loop

```
Pick a request → Assign models → (read code) → Route request → Follow graph → Read score → Swap & retry
      ①               ②                          ⑤–⑥              ①–④
```

Repeat until you beat your **best run score** and clear the side challenges.

---

## Lab layout

| Column | Contents |
|--------|----------|
| **Left** | Request inbox → Model roster → Code editor |
| **Middle** | StateGraph (top) · Pipeline overview carousel (bottom) |
| **Right** | Score formula · tiers · challenges · Efficiency Observatory |

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

**What it is:** a readable **blueprint** of a real LangGraph routing agent in Python — `RouterState`, embedding, `semantic_router`, conditional edges, and `ROUTE_MODELS`.

**What it is not:** executable code in this lab. Nothing runs on a server; the simulator drives results from your **request + roster**, not from Python execution.

**What it does:**
- **Gates runs** — **Route request** requires `StateGraph`, `embed_semantic`, `semantic_router`, and `add_conditional_edges` to still be present.
- **Syncs with roster** — when you change dropdowns, the `ROUTE_MODELS = { ... }` block updates automatically.
- **Teaches LangGraph** — pipeline carousel code hints and graph node labels map back to this file.

**To win the game:** focus on inbox + roster. You can leave the starter code unchanged.

---

### 4. Route request

Click **Route request** in the header (step 4 of the guided tour).

The simulation runs using your inbox pick and roster assignments. After a run, hover **Routed to LLM** in the editor toolbar for a quick result summary and numbered score breakdown.

---

## Middle column — graph & pipeline

### 5. StateGraph

The top of the middle column is the **live LangGraph visualization**.

During a run:
- The **active node** pulses with a cyan highlight (`▶ HERE`).
- **Completed nodes** along the taken path stay lit.
- The **chosen LLM branch** is highlighted; the other two LLM nodes fade as *skipped*.
- The **legend** lists your current roster assignment per route.

Use this to see *where* in the pipeline you are — not just *what* scored.

---

### 6. Pipeline overview

The carousel below the graph explains *what each step does*.

| Mode | When | What you see |
|------|------|----------------|
| **Pipeline overview** | Before first run | Intro slides: pre-routing chain → conditional branch → metrics exit |
| **Node overview** | After a run | Slides synced to the graph — step through nodes, read RouterState deltas |

Use **◀ ▶** or the dot timeline to navigate. After a run, clicking a slide jumps the graph to that step.

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

Session-level dashboard below the score panel: routing rings, accuracy, latency, cost, and per-LLM efficiency bars. Use it to compare models across many runs; use the **Score formula** panel for per-run breakdown.

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

1. Complete or skim the **guided tour** (or click **Guide** if you dismissed it).
2. Run **Vendor Contract PDF** with the default roster. Note a mediocre score (weak PDF fit).
3. Assign **Claude 3.5 Sonnet**, **Docling**, or **Qwen2-VL** to the **PDF** route. Run again — watch ② rise.
4. Run **Q4 Sales Spreadsheet**. Put **GPT-4o** or **TableTransformer** on the **spreadsheet** route.
5. Run **Unstructured Prompt**. Keep a cheap model on the **unstructured** route.
6. Step through the **Pipeline overview** after a run to see RouterState at each node.
7. Check the formula panel after each run. Beat your **best run score**.

---

## What runs under the hood (simulation)

When you click **Route request**, the lab:

1. Scores the input against route centroids (semantic routing simulation).
2. Picks the winning route and the model **you assigned** to that route.
3. Computes quality from model–route affinity, latency and cost from model profiles, then applies the game formula above.

The StateGraph and pipeline carousel reflect that simulated path — they mirror how a real LangGraph agent would flow, without calling external APIs.

---

## Quick reference

| I want to… | Do this |
|------------|---------|
| See where to start | **Guide** in the lab header (7-step tour) |
| Raise ① | Pick samples that match their type; routing is automatic once the input is clear |
| Raise ② | Match multimodal/strong models to PDF; tabular models to spreadsheet |
| Raise ③ | Prefer faster models when fit is already good enough |
| Limit ④ | Avoid oversized models when a smaller one fits |
| Understand the pipeline | Read **Pipeline overview** carousel (middle column, bottom) |
| Understand the code | Read `router_agent.py` — blueprint only, synced to your roster |
| Try a new model | HF pull field, or pick from the catalog (👁 = multimodal) |
| Reset progress | **Reset scores** in the lab header |
| Go back to overview | **Hub** in the lab header |

---

## Hub recap

The Hub shows tier targets, route types (you choose the models), and a preview of the efficiency dashboard. Pipeline on the Hub:

**Pick a request → Assign models → Route & read score → Swap & retry**

Full lab order (matches the guided tour):

**Inbox → Roster → Code → Run → StateGraph → Pipeline overview → Score**

---

## Deploy locally

```bash
npm install
npm run dev
```

Push to `main` on GitHub to redeploy Pages automatically (see README).
