import { useState } from "react";
import { Alert, Box, Button, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { getInsights } from "../services/insightService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";

interface AiInsightsProps {
  playerId: string;
  matchId: string;
}

interface InsightChipRowProps {
  label: string;
  items: string[];
  color: "success" | "warning" | "info";
}

function InsightChipRow({ label, items, color }: InsightChipRowProps) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 0.5 }}>
        {items.map((item) => (
          <Chip key={item} label={item} size="small" color={color} variant="outlined" />
        ))}
      </Stack>
    </Box>
  );
}

interface InsightTextBlockProps {
  label: string;
  text: string;
}

function InsightTextBlock({ label, text }: InsightTextBlockProps) {
  if (!text) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

// Data-driven list of AI coach sections rendered after the summary, so adding another
// section (list-shaped or prose-shaped) is a one-line change here rather than a
// structural rewrite of the component. Order here is the render order.
type InsightSection =
  | { kind: "list"; label: string; items: string[]; color: "success" | "warning" | "info" }
  | { kind: "text"; label: string; text: string };

function buildInsightSections(insight: Insight): InsightSection[] {
  return [
    { kind: "list", label: "STRENGTHS", items: insight.strengths, color: "success" },
    { kind: "list", label: "WEAKNESSES", items: insight.weaknesses, color: "warning" },
    { kind: "list", label: "RECOMMENDATIONS", items: insight.recommendations, color: "info" },
    { kind: "text", label: "PLAYSTYLE ANALYSIS", text: insight.playstyle },
    { kind: "text", label: "SEASON PROGRESS", text: insight.seasonProgress },
    { kind: "list", label: "RISK FACTORS", items: insight.riskFactors, color: "warning" },
    { kind: "list", label: "TRAINING PRIORITIES", items: insight.trainingPriorities, color: "info" },
  ];
}

function sectionHasContent(section: InsightSection): boolean {
  return section.kind === "list" ? section.items.length > 0 : section.text.length > 0;
}

function AiInsights({ playerId, matchId }: AiInsightsProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const result = await getInsights(playerId, matchId);
      setInsight(result);
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate insights for this match."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {!insight && (
        <Button variant="outlined" size="small" onClick={handleGenerate} disabled={loading} fullWidth>
          {loading ? "Generating..." : "Generate AI Insights"}
        </Button>
      )}

      {loading && (
        <Box sx={{ mt: 1, bgcolor: "background.paper", borderRadius: "6px", p: 2 }}>
          <Skeleton variant="text" width="45%" height={16} />
          <Skeleton variant="text" width="95%" height={20} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="80%" height={20} />
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Skeleton variant="rounded" width={72} height={24} sx={{ borderRadius: "16px" }} />
            <Skeleton variant="rounded" width={90} height={24} sx={{ borderRadius: "16px" }} />
          </Stack>
        </Box>
      )}

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {insight && (
        <Box sx={{ mt: 1, bgcolor: "background.paper", borderRadius: "6px", p: 2 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
            AI PERFORMANCE SUMMARY
          </Typography>
          {insight.source !== "gemini" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Basic summary — AI is temporarily unavailable, showing a simplified breakdown instead
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {insight.summary}
          </Typography>

          {(() => {
            const sections = buildInsightSections(insight);
            const visibleSections = sections.filter(sectionHasContent);

            return (
              <>
                {visibleSections.length > 0 && <Divider sx={{ my: 1.5 }} />}
                {visibleSections.map((section) =>
                  section.kind === "list" ? (
                    <InsightChipRow key={section.label} label={section.label} items={section.items} color={section.color} />
                  ) : (
                    <InsightTextBlock key={section.label} label={section.label} text={section.text} />
                  )
                )}
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
