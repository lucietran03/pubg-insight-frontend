import { useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getInsights } from "../services/insightService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";

interface AiInsightsProps {
  playerId: string;
  matchId: string;
}

// Small eyebrow-style label reused across the report's sections. Kept intentionally
// plain (no border/box of its own) so each section below can carry its own distinct
// visual treatment instead of repeating one "label + box" pattern six times.
function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ display: "block", fontWeight: 800, letterSpacing: 1, color }}
    >
      {text}
    </Typography>
  );
}

// 2 - "What You Did Well" / 3 - "What Hurt Your Performance", read like a VOD review:
// good habits and bad habits placed side-by-side so the contrast is immediate instead of
// two more identical list boxes stacked vertically. Risk factors are folded into the
// "hurt" side (append after weaknesses) since both are "things going wrong" and the
// narrative has no separate slot for them.
function ReviewColumn({
  label,
  items,
  glyph,
  tone,
}: {
  label: string;
  items: string[];
  glyph: string;
  tone: "success" | "error";
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.4),
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.08),
      }}
    >
      <SectionLabel text={label} color={`${tone}.main`} />
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {items.map((item) => (
          <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Typography component="span" sx={{ color: `${tone}.main`, fontWeight: 800, fontSize: 13, lineHeight: 1.6 }}>
              {glyph}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {item}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

// 4 - "Key Coaching Advice": a numbered checklist rather than a chip row, so the handful
// of recommendations read as concrete next actions instead of another tag list.
function CoachingChecklist({ items }: { items: string[] }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <SectionLabel text="KEY COACHING ADVICE" color="primary.main" />
      <Stack spacing={1.25} sx={{ mt: 1 }}>
        {items.map((item, index) => (
          <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Box
              sx={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                color: "#121212",
              }}
            >
              {index + 1}
            </Box>
            <Typography variant="body2" sx={{ pt: 0.1, lineHeight: 1.6 }}>
              {item}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
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

  // "Hurt" side of the review pairing folds risk factors in after weaknesses - both are
  // negative signals, weaknesses first since they're the direct, already-prioritized
  // read on the match, risk factors appended as broader concerns.
  const hurtItems = insight ? [...insight.weaknesses, ...insight.riskFactors] : [];
  const hasStrengths = !!insight && insight.strengths.length > 0;
  const hasHurt = !!insight && hurtItems.length > 0;

  // Cap to the top 3 - the brief asks for a short, punchy set of coaching calls, not
  // every recommendation the model produced.
  const topRecommendations = insight ? insight.recommendations.slice(0, 3) : [];

  const hasDevelopment = !!insight && (insight.seasonProgress.length > 0 || insight.trainingPriorities.length > 0);

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
              AI COACH REPORT
            </Typography>
          </Stack>
          {insight.source !== "gemini" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Basic summary — AI is temporarily unavailable, showing a simplified breakdown instead
            </Typography>
          )}

          {/* 1 - Overall Verdict: a headline statement, not another bordered box - the
              one thing that should catch the eye first, before any list. */}
          {insight.summary.length > 0 && (
            <Typography
              variant="h6"
              sx={{ mt: 1.25, fontWeight: 800, lineHeight: 1.35, color: "text.primary" }}
            >
              {insight.summary}
            </Typography>
          )}

          {/* 2 & 3 - What You Did Well vs What Hurt Your Performance, paired side-by-side
              on wider screens with a clear green-vs-red visual language. */}
          {(hasStrengths || hasHurt) && (
            <Box
              sx={{
                mt: 2.5,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: hasStrengths && hasHurt ? "1fr 1fr" : "1fr" },
                gap: 1.5,
              }}
            >
              {hasStrengths && (
                <ReviewColumn label="WHAT YOU DID WELL" items={insight.strengths} glyph="✓" tone="success" />
              )}
              {hasHurt && (
                <ReviewColumn label="WHAT HURT YOUR PERFORMANCE" items={hurtItems} glyph="!" tone="error" />
              )}
            </Box>
          )}

          {/* 4 - Key Coaching Advice: numbered checklist. */}
          {topRecommendations.length > 0 && <CoachingChecklist items={topRecommendations} />}

          {/* 5 - Playstyle Diagnosis: editorial, blockquote-style prose - visually
              distinct from the list-heavy sections above. */}
          {insight.playstyle.length > 0 && (
            <Box
              sx={{
                mt: 2.5,
                pl: 2,
                py: 1,
                borderLeft: "3px solid",
                borderColor: "primary.main",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                borderRadius: "0 6px 6px 0",
              }}
            >
              <SectionLabel text="PLAYSTYLE DIAGNOSIS" color="primary.main" />
              <Typography variant="body1" sx={{ mt: 0.5, fontStyle: "italic", lineHeight: 1.7 }}>
                {insight.playstyle}
              </Typography>
            </Box>
          )}

          {/* 6 - Long-term Development: season-level, forward-looking prose
              (seasonProgress) plus a practice roadmap (trainingPriorities), blended into
              one editorial block rather than two more separate boxes. */}
          {hasDevelopment && (
            <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 1.5, bgcolor: "background.default" }}>
              <SectionLabel text="LONG-TERM DEVELOPMENT" color="info.main" />
              {insight.seasonProgress.length > 0 && (
                <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                  {insight.seasonProgress}
                </Typography>
              )}
              {insight.trainingPriorities.length > 0 && (
                <Stack spacing={0.75} sx={{ mt: insight.seasonProgress.length > 0 ? 1.25 : 0.75 }}>
                  {insight.trainingPriorities.map((item) => (
                    <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                      <Typography component="span" sx={{ color: "info.main", fontWeight: 800, fontSize: 13, lineHeight: 1.6 }}>
                        →
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
