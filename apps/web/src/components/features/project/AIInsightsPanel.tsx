import React, { useReducer, useEffect, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import {
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";

interface AIInsightsPanelProps {
  projectId: Id<"projects">;
  sprintId?: Id<"sprints">;
  compact?: boolean;
}

interface InsightsData {
  sprintHealth: {
    score: number;
    prediction: "on-track" | "at-risk" | "delayed";
    confidence: number;
    suggestions: string[];
  };
  teamInsights?: {
    sentiment: "positive" | "neutral" | "concerned";
    observations: string[];
  };
  recommendations?: string[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    completionRate: number;
    avgVelocity: number;
    currentVelocity: number;
  };
  risks: {
    type: string;
    severity: "high" | "medium" | "low";
    message: string;
  }[];
  aiGenerated: boolean;
}

// ── Sub-components ──

interface SprintHealthCardProps {
  insights: InsightsData;
  getHealthIcon: (prediction: string) => React.ReactNode;
  getHealthColor: (prediction: string) => string;
}

function SprintHealthCard({
  insights,
  getHealthIcon,
  getHealthColor,
}: SprintHealthCardProps) {
  return (
    <div
      className="border-2 p-[10px]"
      style={{ borderColor: getHealthColor(insights.sprintHealth.prediction) }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-[6px] mb-[4px]">
            {getHealthIcon(insights.sprintHealth.prediction)}
            <h3 className="text-base font-bold font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
              Sprint Health Score
            </h3>
          </div>
          <div
            className="text-[20px] font-bold mb-[2px]"
            style={{ color: getHealthColor(insights.sprintHealth.prediction) }}
          >
            {insights.sprintHealth.score}%
          </div>
          <div className="text-sm text-[#9CA3AF]">
            Status:{" "}
            {insights.sprintHealth.prediction.toUpperCase().replace("-", " ")}
          </div>
          {insights.sprintHealth.confidence && (
            <div className="text-xs text-[#6B7280] mt-4px">
              Confidence: {(insights.sprintHealth.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-2 gap-[8px]">
          <div>
            <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
              Completed
            </div>
            <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">
              {insights.metrics.completedTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
              In Progress
            </div>
            <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">
              {insights.metrics.inProgressTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
              Blocked
            </div>
            <div className="text-[14px] font-semibold font-bold text-[#EF4444]">
              {insights.metrics.blockedTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
              Velocity
            </div>
            <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">
              {insights.metrics.currentVelocity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RisksSectionProps {
  risks: InsightsData["risks"];
  getSeverityColor: (severity: string) => string;
}

interface CompactInsightsViewProps {
  insights: InsightsData;
  loading: boolean;
  fetchInsights: () => void;
  getHealthIcon: (prediction: string) => React.ReactNode;
  getHealthColor: (prediction: string) => string;
}

function CompactInsightsView({
  insights,
  loading,
  fetchInsights,
  getHealthIcon,
  getHealthColor,
}: CompactInsightsViewProps) {
  return (
    <div className="bg-[#111111] border-2 border-[#2E2E35] p-3">
      <div className="flex items-center justify-between mb-[6px]">
        <div className="flex items-center gap-[4px]">
          <HiOutlineSparkles className="w-16px h-16px text-[#6366F1]" />
          <h3 className="text-sm font-bold uppercase font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
            AI Insights
          </h3>
          {insights.aiGenerated && (
            <span className="text-xs text-[#6B7280]">(AI-Powered)</span>
          )}
        </div>
        <button
          onClick={fetchInsights}
          className="p-4px hover:bg-[#0A0A0A] transition-colors"
          title="Refresh insights"
          disabled={loading}
        >
          <HiOutlineRefresh
            className={`w-14px h-14px text-[#9CA3AF] ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px]">
        <div className="flex items-center gap-[4px]">
          {getHealthIcon(insights.sprintHealth.prediction)}
          <div>
            <div
              className="text-sm font-bold"
              style={{
                color: getHealthColor(insights.sprintHealth.prediction),
              }}
            >
              Sprint Health: {insights.sprintHealth.score}%
            </div>
            <div className="text-xs text-[#9CA3AF]">
              {insights.sprintHealth.prediction.replace("-", " ")}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[4px]">
          {insights.metrics.currentVelocity > insights.metrics.avgVelocity ? (
            <HiOutlineTrendingUp className="w-20px h-20px text-[#22C55E]" />
          ) : (
            <HiOutlineTrendingDown className="w-20px h-20px text-[#F59E0B]" />
          )}
          <div>
            <div className="text-sm font-bold text-[#F9FAFB]">
              {insights.metrics.completionRate.toFixed(0)}% Complete
            </div>
            <div className="text-xs text-[#9CA3AF]">
              {insights.metrics.completedTasks}/{insights.metrics.totalTasks}{" "}
              tasks
            </div>
          </div>
        </div>

        {(insights.risks.length > 0 ||
          insights.sprintHealth.suggestions.length > 0) && (
          <div className="flex items-center gap-[4px]">
            <HiOutlineLightBulb className="w-20px h-20px text-[#06B6D4]" />
            <div className="text-xs text-[#9CA3AF]">
              {insights.risks.length > 0
                ? insights.risks[0].message
                : insights.sprintHealth.suggestions[0]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SuggestionsSectionProps {
  suggestions: string[];
}

function SuggestionsSection({ suggestions }: SuggestionsSectionProps) {
  if (suggestions.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-bold uppercase mb-[6px] flex items-center gap-[4px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
        <HiOutlineLightBulb className="w-16px h-16px text-[#06B6D4]" />
        AI Suggestions
      </h3>
      <div className="space-y-[4px]">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion}
            className="flex items-start gap-[4px] p-[4px] bg-[#06B6D4]/10 border border-[#06B6D4]"
          >
            <span className="text-xs">💡</span>
            <span className="text-sm text-[#F9FAFB]">{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TeamInsightsSectionProps {
  teamInsights: NonNullable<InsightsData["teamInsights"]>;
}

function TeamInsightsSection({ teamInsights }: TeamInsightsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase mb-[6px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
        Team Insights
      </h3>
      <div className="space-y-[4px]">
        <div className="flex items-center gap-[4px]">
          <span className="text-sm text-[#9CA3AF]">Team Sentiment:</span>
          <span
            className="text-sm font-bold px-[4px] py-4px border font-['IBM_Plex_Mono',monospace]"
            style={{
              borderColor:
                teamInsights.sentiment === "positive"
                  ? "#22C55E"
                  : teamInsights.sentiment === "concerned"
                    ? "#F59E0B"
                    : "#06B6D4",
              backgroundColor:
                (teamInsights.sentiment === "positive"
                  ? "#22C55E"
                  : teamInsights.sentiment === "concerned"
                    ? "#F59E0B"
                    : "#06B6D4") + "20",
            }}
          >
            {teamInsights.sentiment.toUpperCase()}
          </span>
        </div>
        {teamInsights.observations.map((observation) => (
          <div key={observation} className="text-sm text-[#9CA3AF]">
            • {observation}
          </div>
        ))}
      </div>
    </div>
  );
}

function RisksSection({ risks, getSeverityColor }: RisksSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase mb-[6px] flex items-center gap-[4px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
        <HiOutlineExclamation className="w-16px h-16px text-[#F59E0B]" />
        Identified Risks
      </h3>
      {risks.length === 0 && (
        <div className="text-xs text-[#22C55E] font-['IBM_Plex_Mono',monospace] p-2 border border-[#22C55E]/20 bg-[#22C55E]/5">
          No risks identified
        </div>
      )}
      <div className="space-y-[4px]">
        {risks.map((risk) => (
          <div
            key={risk.message}
            className="flex items-start gap-[4px] p-[4px] border"
            style={{
              borderColor: getSeverityColor(risk.severity),
              backgroundColor: getSeverityColor(risk.severity) + "10",
            }}
          >
            <span
              className="text-xs font-bold font-['IBM_Plex_Mono',monospace]"
              style={{ color: getSeverityColor(risk.severity) }}
            >
              {risk.severity.toUpperCase()}
            </span>
            <span className="text-sm text-[#F9FAFB]">{risk.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FetchState {
  insights: InsightsData | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date;
}

type FetchAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: InsightsData }
  | { type: "FETCH_ERROR"; error: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        insights: action.data,
        lastRefresh: new Date(),
        loading: false,
      };
    case "FETCH_ERROR":
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

export default function AIInsightsPanel({
  projectId,
  sprintId,
  compact = false,
}: AIInsightsPanelProps) {
  const [fetchState, dispatchFetch] = useReducer(fetchReducer, {
    insights: null,
    loading: false,
    error: null,
    lastRefresh: new Date(),
  });

  const { insights, loading, error, lastRefresh } = fetchState;

  const generateInsights = useAction(
    api.ai.projectInsights.generateProjectInsights,
  );
  const createAIInsight = useMutation(api.ai.mutations.createAIInsight as any);

  // Persist generated insights to the aiInsights table so they're queryable
  const persistInsights = useCallback(
    async (data: InsightsData) => {
      try {
        const targetId = sprintId
          ? (sprintId as string)
          : (projectId as string);
        const targetType = sprintId
          ? ("sprint" as const)
          : ("project" as const);
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 min TTL

        // Persist each risk as an insight
        for (const risk of data.risks) {
          await createAIInsight({
            targetType,
            targetId,
            insightType: "risk" as const,
            severity:
              risk.severity === "high"
                ? ("high" as const)
                : risk.severity === "medium"
                  ? ("medium" as const)
                  : ("low" as const),
            title: `${risk.type.replace(/_/g, " ").toUpperCase()} Risk`,
            description: risk.message,
            recommendations: data.sprintHealth.suggestions.slice(0, 3),
            dedupeKey: `risk:${risk.type}:${risk.message}`,
            expiresAt,
          });
        }

        // Persist the overall health prediction
        if (data.sprintHealth) {
          const predSeverity =
            data.sprintHealth.prediction === "delayed"
              ? ("critical" as const)
              : data.sprintHealth.prediction === "at-risk"
                ? ("high" as const)
                : ("low" as const);
          await createAIInsight({
            targetType,
            targetId,
            insightType: "prediction" as const,
            severity: predSeverity,
            title: `Sprint Health: ${data.sprintHealth.prediction.toUpperCase().replace("-", " ")}`,
            description: `Health score: ${data.sprintHealth.score}%. Confidence: ${(data.sprintHealth.confidence * 100).toFixed(0)}%. Completion: ${data.metrics.completionRate.toFixed(0)}%.`,
            recommendations: data.sprintHealth.suggestions,
            dedupeKey: "prediction:sprint-health",
            metadata: {
              score: data.sprintHealth.score,
              prediction: data.sprintHealth.prediction,
            },
            expiresAt,
          });
        }

        // Persist AI recommendations
        if (data.recommendations && data.recommendations.length > 0) {
          await createAIInsight({
            targetType,
            targetId,
            insightType: "recommendation" as const,
            severity: "medium" as const,
            title: "AI Recommendations",
            description: data.recommendations.join(" | "),
            recommendations: data.recommendations,
            dedupeKey: "recommendation:ai-top-actions",
            expiresAt,
          });
        }
      } catch (err) {
        // Non-critical: don't break the UI if persistence fails
        console.warn("Failed to persist AI insights:", err);
      }
    },
    [projectId, sprintId, createAIInsight],
  );

  const fetchInsights = useCallback(async () => {
    dispatchFetch({ type: "FETCH_START" });
    try {
      const data = await generateInsights({ projectId, sprintId });
      const insightsData = data as InsightsData;
      dispatchFetch({ type: "FETCH_SUCCESS", data: insightsData });
      await persistInsights(insightsData);
    } catch (err) {
      dispatchFetch({
        type: "FETCH_ERROR",
        error:
          err instanceof Error ? err.message : "Failed to generate insights",
      });
      console.error("Failed to generate insights:", err);
    }
  }, [generateInsights, persistInsights, projectId, sprintId]);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchInsights();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [fetchInsights]);

  const getHealthIcon = (prediction: string) => {
    switch (prediction) {
      case "on-track":
        return (
          <HiOutlineCheckCircle className="w-20px h-20px text-[#22C55E]" />
        );
      case "at-risk":
        return (
          <HiOutlineExclamation className="w-20px h-20px text-[#F59E0B]" />
        );
      case "delayed":
        return <HiOutlineClock className="w-20px h-20px text-[#EF4444]" />;
      default:
        return <HiOutlineSparkles className="w-20px h-20px" />;
    }
  };

  const getHealthColor = (prediction: string) => {
    switch (prediction) {
      case "on-track":
        return "#22C55E";
      case "at-risk":
        return "#F59E0B";
      case "delayed":
        return "#EF4444";
      default:
        return "#F9FAFB";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#06B6D4";
      default:
        return "#9CA3AF";
    }
  };

  if (loading && !insights) {
    return (
      <div className="bg-[#111111] border-2 border-[#2E2E35] p-4">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-20px h-20px animate-pulse text-[#6366F1]" />
          <span className="text-sm text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
            Generating AI insights...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border-2 border-[#EF4444] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <HiOutlineExclamation className="w-20px h-20px text-[#EF4444]" />
            <span className="text-sm text-[#F9FAFB]">
              Failed to load insights
            </span>
          </div>
          <button
            onClick={fetchInsights}
            className="p-[4px] hover:bg-[#0A0A0A] transition-colors"
            title="Retry"
          >
            <HiOutlineRefresh className="w-16px h-16px text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  if (compact) {
    return (
      <CompactInsightsView
        insights={insights}
        loading={loading}
        fetchInsights={fetchInsights}
        getHealthIcon={getHealthIcon}
        getHealthColor={getHealthColor}
      />
    );
  }

  // Full view
  return (
    <div className="bg-[#111111] border-2 border-[#2E2E35] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-4 h-4 text-[#6366F1]" />
          <h2 className="text-[14px] font-semibold font-bold uppercase font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
            AI Project Insights
          </h2>
          {insights.aiGenerated && (
            <span className="text-xs text-[#9CA3AF] px-[4px] py-4px bg-[#6366F1]/10 border border-[#6366F1]">
              AI-POWERED
            </span>
          )}
        </div>
        <button
          onClick={fetchInsights}
          className="p-[4px] hover:bg-[#0A0A0A] transition-colors"
          title="Refresh insights"
          disabled={loading}
        >
          <HiOutlineRefresh
            className={`w-20px h-20px text-[#9CA3AF] ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Loading overlay during refresh */}
      {loading && insights && (
        <div className="flex items-center gap-2 p-2 bg-[#6366F1]/10 border border-[#6366F1]/30">
          <HiOutlineRefresh className="w-4 h-4 animate-spin text-[#6366F1]" />
          <span className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">
            Refreshing insights...
          </span>
        </div>
      )}

      {/* Sprint Health Score */}
      <SprintHealthCard
        insights={insights}
        getHealthIcon={getHealthIcon}
        getHealthColor={getHealthColor}
      />

      {/* Suggestions */}
      <SuggestionsSection suggestions={insights.sprintHealth.suggestions} />

      {/* Risks */}
      <RisksSection
        risks={insights.risks}
        getSeverityColor={getSeverityColor}
      />

      {/* Team Insights */}
      {insights.teamInsights && (
        <TeamInsightsSection teamInsights={insights.teamInsights} />
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase mb-[6px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
            Recommendations
          </h3>
          <div className="space-y-[4px]">
            {insights.recommendations.map((rec, recIndex) => (
              <div key={rec} className="flex items-start gap-[4px]">
                <span className="text-sm text-[#6366F1]">{recIndex + 1}.</span>
                <span className="text-sm text-[#F9FAFB]">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-[8px] border-t border-[#1F1F23] flex items-center justify-between">
        <span className="text-xs text-[#6B7280] font-['IBM_Plex_Mono',monospace]">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
        <span className="text-xs text-[#6B7280] font-['IBM_Plex_Mono',monospace]">
          Auto-refreshes every 5 minutes
        </span>
      </div>
    </div>
  );
}
