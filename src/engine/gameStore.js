import { GAME_CHALLENGES, GAME_TIERS, getTierForScore } from "../data/models.js";

const STORAGE_KEY = "semantic-routing-lab-game";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function createGameStore() {
  const persisted = loadPersisted();
  let bestScore = persisted.bestScore ?? 0;
  let bestTier = persisted.bestTier ?? null;
  let runs = [];
  let challenges = { ...persisted.challenges };

  const save = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ bestScore, bestTier, challenges })
      );
    } catch {
      /* ignore */
    }
  };

  return {
    getState: () => ({ bestScore, bestTier, runs, challenges }),

    recordRun(result, input, roster) {
      const entry = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        timestamp: Date.now(),
        gameScore: result.gameScore,
        efficiencyScore: result.efficiencyScore,
        inputLabel: input.label,
        route: result.route,
        model: result.llm.model,
        routingCorrect: result.routingCorrect,
        roster: { ...roster },
      };

      runs = [entry, ...runs].slice(0, 20);

      if (result.gameScore > bestScore) {
        bestScore = result.gameScore;
        bestTier = getTierForScore(bestScore)?.id ?? null;
        save();
      }

      if (result.routingCorrect) {
        challenges["route-all"] = (challenges["route-all"] ?? 0) + 1;
      }
      if (result.llm?.source === "huggingface") {
        challenges["hf-pull"] = true;
      }
      if (result.efficiencyScore >= 70) {
        challenges[`eff-${result.route}`] = true;
      }
      save();

      return entry;
    },

    reset() {
      bestScore = 0;
      bestTier = null;
      runs = [];
      challenges = {};
      save();
    },

    getSummary(metrics) {
      const tier = getTierForScore(bestScore);
      const nextTier = GAME_TIERS.find((t) => t.minScore > bestScore);

      return {
        bestScore,
        tier,
        nextTier,
        pointsToNext: nextTier ? nextTier.minScore - bestScore : 0,
        challenges: GAME_CHALLENGES.map((c) => ({
          ...c,
          done:
            c.id === "route-all"
              ? (metrics?.routingAccuracy ?? 0) >= 0.8 && (metrics?.totalRequests ?? 0) >= 6
              : c.id === "hf-pull"
                ? Boolean(challenges["hf-pull"])
                : c.id === "specialist"
                  ? Boolean(challenges["eff-pdf"] && challenges["eff-spreadsheet"])
                  : c.id === "budget"
                    ? (metrics?.totalCostUsd ?? 1) < 0.05 && (metrics?.totalRequests ?? 0) >= 4
                    : false,
        })),
        recentRuns: runs.slice(0, 5),
      };
    },
  };
}
