const INITIAL = {
  totalRequests: 0,
  correctRoutes: 0,
  totalRoutingLatencyMs: 0,
  totalLlmLatencyMs: 0,
  totalCostUsd: 0,
  history: [],
  byRoute: {
    pdf: { count: 0, totalQuality: 0, totalCost: 0, totalLatency: 0, correct: 0 },
    spreadsheet: { count: 0, totalQuality: 0, totalCost: 0, totalLatency: 0, correct: 0 },
    unstructured: { count: 0, totalQuality: 0, totalCost: 0, totalLatency: 0, correct: 0 },
  },
  byLlm: {},
};

export function createMetricsStore() {
  let state = structuredClone(INITIAL);

  return {
    getState: () => state,

    record(result, input) {
      const entry = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        timestamp: Date.now(),
        inputLabel: input.label,
        expectedRoute: input.kind,
        actualRoute: result.route,
        correct: result.routingCorrect,
        confidence: result.confidence,
        routingLatencyMs: result.routingLatencyMs,
        llmLatencyMs: result.llmLatencyMs,
        totalLatencyMs: result.totalLatencyMs,
        costUsd: result.costUsd,
        qualityScore: result.qualityScore,
        gameScore: result.gameScore,
        efficiencyScore: result.efficiencyScore,
        model: result.llm.model,
      };

      state = {
        ...state,
        totalRequests: state.totalRequests + 1,
        correctRoutes: state.correctRoutes + (result.routingCorrect ? 1 : 0),
        totalRoutingLatencyMs: state.totalRoutingLatencyMs + result.routingLatencyMs,
        totalLlmLatencyMs: state.totalLlmLatencyMs + result.llmLatencyMs,
        totalCostUsd: state.totalCostUsd + result.costUsd,
        history: [entry, ...state.history].slice(0, 24),
        byRoute: {
          ...state.byRoute,
          [result.route]: {
            ...state.byRoute[result.route],
            count: state.byRoute[result.route].count + 1,
            totalQuality: state.byRoute[result.route].totalQuality + result.qualityScore,
            totalCost: state.byRoute[result.route].totalCost + result.costUsd,
            totalLatency: state.byRoute[result.route].totalLatency + result.llmLatencyMs,
            correct: state.byRoute[result.route].correct + (result.routingCorrect ? 1 : 0),
          },
        },
        byLlm: {
          ...state.byLlm,
          [result.llm.model]: {
            model: result.llm.model,
            label: result.llm.displayName ?? result.llm.label,
            color: result.llm.color ?? "#a78bfa",
            count: (state.byLlm[result.llm.model]?.count ?? 0) + 1,
            totalQuality: (state.byLlm[result.llm.model]?.totalQuality ?? 0) + result.qualityScore,
            totalCost: (state.byLlm[result.llm.model]?.totalCost ?? 0) + result.costUsd,
            totalLatency: (state.byLlm[result.llm.model]?.totalLatency ?? 0) + result.llmLatencyMs,
            route: result.route,
          },
        },
      };

      return entry;
    },

    reset() {
      state = structuredClone(INITIAL);
    },

    getSummary() {
      const n = state.totalRequests || 1;
      const routingAccuracy = state.totalRequests ? state.correctRoutes / state.totalRequests : 0;
      const avgRoutingMs = state.totalRoutingLatencyMs / n;
      const avgLlmMs = state.totalLlmLatencyMs / n;

      const routingEfficiency = Math.min(
        100,
        routingAccuracy * 100 * (1 - avgRoutingMs / 2000)
      );

      const llmStats = Object.values(state.byLlm).map((s) => {
        const count = s.count || 1;
        const avgQuality = s.totalQuality / count;
        const avgCost = s.totalCost / count;
        const avgLatency = s.totalLatency / count;
        const efficiency = Math.min(100, (avgQuality / (avgCost * 80 + avgLatency / 800)) * 18);
        return { ...s, avgQuality, avgCost, avgLatency, efficiency };
      });

      const routeDistribution = Object.entries(state.byRoute).map(([route, data]) => ({
        route,
        count: data.count,
        accuracy: data.count ? data.correct / data.count : 0,
        avgQuality: data.count ? data.totalQuality / data.count : 0,
      }));

      return {
        routingAccuracy,
        routingEfficiency,
        avgRoutingMs,
        avgLlmMs,
        totalCostUsd: state.totalCostUsd,
        totalRequests: state.totalRequests,
        llmStats,
        routeDistribution,
        history: state.history,
      };
    },
  };
}
