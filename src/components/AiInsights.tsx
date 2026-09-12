import { useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { getInsights } from "../services/insightService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";

interface AiInsightsProps {
  playerId: string;
  matchId: string;
}

type SectionTone = "success" | "warning" | "info" | "primary";

// One glyph + color per tone, reused for both the section's accent border and (for list
// sections) the Chip color - a small, consistent visual vocabulary instead of every
// section looking identical.
const TONE_STYLE: Record<SectionTone, { glyph: string; color: string }> = {
  success: { glyph: "✓", color: "success.main" },
  warning: { glyph: "!", color: "warning.main" },
  info: { glyph: "→", color: "info.main" },
  primary: { glyph: "◆", color: "primary.main" },
};

interface SectionShellProps {
  label: string;
  tone: SectionTone;
  children: ReactNode;
}

// Card-within-a-card: a colored left accent bar + glyph turns a flat stack of captions
// into distinct, scannable report sections - the "AI coach report" feel the product
// vision asks for, without pulling in an icon library.
function SectionShell({ label, tone, children }: SectionShellProps) {
  const { glyph, color } = TONE_STYLE[tone];
  return (
    <Box
      sx={{
        mt: 1.5,
        py: 1,
        pl: 1.5,
        pr: 1,
        borderLeft: "3px solid",
        borderColor: color,
        bgcolor: "background.default",
        borderRadius: "0 6px 6px 0",
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Typography component="span" sx={{ color, fontWeight: 800, fontSize: 13, lineHeight: 1 }}>
          {glyph}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </Stack>
      <Box sx={{ mt: 0.75 }}>{children}</Box>
    </Box>
  );
}

function InsightChipList({ items, tone }: { items: string[]; tone: "success" | "warning" | "info" }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {items.map((item) => (
        <Chip key={item} label={item} size="small" color={tone} variant="outlined" />
      ))}
    </Stack>
  );
}

// Data-driven list of AI coach sections rendered after the summary, so adding another
// section (list-shaped or prose-shaped) is a one-line change here rather than a
// structural rewrite of the component. Order here is the render order.
type InsightSection =
  | { kind: "list"; label: string; items: string[]; tone: "success" | "warning" | "info" }
  | { kind: "text"; label: string; text: string; tone: SectionTone };

function buildInsightSections(insight: Insight): InsightSection[] {
  return [
    { kind: "list", label: "STRENGTHS", items: insight.strengths, tone: "success" },
    { kind: "list", label: "WEAKNESSES", items: insight.weaknesses, tone: "warning" },
    { kind: "list", label: "RECOMMENDATIONS", items: insight.recommendations, tone: "info" },
    { kind: "text", label: "PLAYSTYLE ANALYSIS", text: insight.playstyle, tone: "primary" },
    { kind: "text", label: "SEASON PROGRESS", text: insight.seasonProgress, tone: "primary" },
    { kind: "list", label: "RISK FACTORS", items: insight.riskFactors, tone: "warning" },
    { kind: "list", label: "TRAINING PRIORITIES", items: insight.trainingPriorities, tone: "info" },
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
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main" }} />
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1 }}>
              AI PERFORMANCE SUMMARY
            </Typography>
          </Stack>
          {insight.source !== "gemini" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Basic summary — AI is temporarily unavailable, showing a simplified breakdown instead
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            {insight.summary}
          </Typography>

          {buildInsightSections(insight)
            .filter(sectionHasContent)
            .map((section) => (
              <SectionShell key={section.label} label={section.label} tone={section.tone}>
                {section.kind === "list" ? (
                  <InsightChipList items={section.items} tone={section.tone} />
                ) : (
                  <Typography variant="body2">{section.text}</Typography>
                )}
              </SectionShell>
            ))}
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
