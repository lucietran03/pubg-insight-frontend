import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getInsights } from "../services/insightService";
import { recordAnalysis } from "../services/historyService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";
import { dedupeAdjacentWords } from "../utils/sanitizeInsightText";
import SectionTitle from "./SectionTitle";

// Applied once here so every downstream render site gets clean text without re-implementing this.
function sanitizeInsight(insight: Insight): Insight {
  return {
    ...insight,
    summary: dedupeAdjacentWords(insight.summary),
    strengths: insight.strengths.map(dedupeAdjacentWords),
    weaknesses: insight.weaknesses.map(dedupeAdjacentWords),
    riskFactors: insight.riskFactors.map(dedupeAdjacentWords),
    recommendations: insight.recommendations.map(dedupeAdjacentWords),
    playstyle: dedupeAdjacentWords(insight.playstyle),
    seasonProgress: dedupeAdjacentWords(insight.seasonProgress),
    trainingPriorities: insight.trainingPriorities.map(dedupeAdjacentWords),
  };
}

interface AiInsightsProps {
  playerId: string;
  matchId: string;
  // Lets the sidebar's Recently Analyzed list refresh right after a new entry is persisted.
  onAnalysisRecorded?: () => void;
}

// Purely narrative - the backend makes one call, not seven; staged to read as a pipeline rather than a frozen spinner.
const LOADING_STAGES = [
  "Connecting to performance data...",
  "Fetching recent match history...",
  "Computing season baselines...",
  "Comparing match performance...",
  "Analyzing player archetype...",
  "Generating coaching recommendations...",
  "Finalizing AI report...",
];

// Minimum time the staged sequence plays, run in parallel with the real request (see handleGenerate), never after it.
const MIN_SEQUENCE_MS = 2800;
const STAGE_MS = MIN_SEQUENCE_MS / LOADING_STAGES.length;

// Arrays arrive in the backend's priority order, so keeping the first N keeps the most
// important items.
const MAX_STRENGTHS = 4;
const MAX_HURT_ITEMS = 3;
const MAX_RISK_FACTORS = 2;
const MAX_RECOMMENDATIONS = 3;
const MAX_TRAINING_PRIORITIES = 3;

function capitalizeFragment(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Input is a single sentence, not a {title, evidence} shape - splits at the first delimiter
// whose trailing half contains a digit, treated as the numeric evidence.
function splitEvidence(sentence: string): { title: string; evidence: string | null } {
  const trimmed = sentence.trim();
  const delimiters = [";", " — ", " - ", ": ", ", "];
  for (const delimiter of delimiters) {
    const idx = trimmed.indexOf(delimiter);
    if (idx > 8 && idx < trimmed.length - 3) {
      const before = trimmed.slice(0, idx).trim();
      const after = trimmed.slice(idx + delimiter.length).trim();
      if (before.length > 0 && after.length > 2 && /\d/.test(after)) {
        return { title: capitalizeFragment(before), evidence: capitalizeFragment(after.replace(/\.$/, "")) };
      }
    }
  }
  return { title: capitalizeFragment(trimmed), evidence: null };
}

// Splits at the first rationale marker present instead of inventing a generic reason;
// " to " is checked last since it's the most common but least specific marker.
function splitRecommendation(sentence: string): { action: string; why: string | null } {
  const trimmed = sentence.trim();
  const lower = trimmed.toLowerCase();
  const markers = [" because ", " since ", " so that ", " given that ", ": ", " — ", " - ", " to "];
  for (const marker of markers) {
    const idx = lower.indexOf(marker);
    if (idx > 8) {
      const action = trimmed.slice(0, idx).trim().replace(/[,;]$/, "");
      const why = trimmed.slice(idx + marker.length).trim().replace(/\.$/, "");
      if (action.length > 0 && why.length > 4) {
        return { action: capitalizeFragment(action), why: capitalizeFragment(why) };
      }
    }
  }
  return { action: capitalizeFragment(trimmed), why: null };
}

// Inferred from keywords in the recommendation's own text, not a separate backend field.
const FOCUS_TAG_RULES: Array<[RegExp, string]> = [
  [/posit/i, "Positioning"],
  [/(aim|accuracy|headshot|precision)/i, "Precision"],
  [/(surviv|circle|zone|rotation)/i, "Survival / Circle Play"],
  [/(aggress|engage|push|frontline|fight)/i, "Aggression"],
  [/(team|squad|support|revive|callout)/i, "Support"],
  [/consisten/i, "Consistency"],
];

function inferFocusTag(sentence: string): string | null {
  const rule = FOCUS_TAG_RULES.find(([pattern]) => pattern.test(sentence));
  return rule ? rule[1] : null;
}

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

// `rankedLines` is only used by Long-term Development, to show trainingPriorities as ranked lines under the paragraph.
function NarrativeCard({
  label,
  paragraph,
  rankedLines,
}: {
  label: string;
  paragraph?: string;
  rankedLines?: string[];
}) {
  return (
    <Box
      sx={{
        mt: 2.5,
        p: 1.75,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
      }}
    >
      <SectionLabel text={label} color="primary.main" />
      {paragraph && (
        <Typography variant="body1" sx={{ mt: 0.75, lineHeight: 1.7 }}>
          {paragraph}
        </Typography>
      )}
      {rankedLines && rankedLines.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: paragraph ? 1.25 : 0.75 }}>
          {rankedLines.map((line, index) => (
            <Stack key={line} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Typography
                component="span"
                variant="caption"
                sx={{ fontWeight: 800, color: "primary.main", flexShrink: 0, minWidth: 16 }}
              >
                {index + 1}.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {line}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// Each item renders as a title line plus an optional evidence line (see splitEvidence).
function EvidenceList({
  label,
  items,
  glyph,
  tone,
}: {
  label: string;
  items: string[];
  glyph: string;
  tone: "success" | "error" | "warning";
}) {
  return (
    <Box
      sx={{
        pl: 1.5,
        borderLeft: "3px solid",
        borderColor: `${tone}.main`,
      }}
    >
      <SectionLabel text={label} color={`${tone}.main`} />
      <Stack spacing={1} sx={{ mt: 1 }}>
        {items.map((item) => {
          const { title, evidence } = splitEvidence(item);
          return (
            <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <Typography
                component="span"
                sx={{ color: `${tone}.main`, fontWeight: 800, fontSize: 13, lineHeight: 1.6 }}
              >
                {glyph}
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.5 }}>
                  {title}
                </Typography>
                {evidence && (
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25 }}>
                    {evidence}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

// Shows a WHY line and inferred FOCUS tag only when the sentence supports it, otherwise just the numbered action.
function ActionPlan({ items }: { items: string[] }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <SectionLabel text="KEY COACHING ADVICE" color="primary.main" />
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {items.map((item, index) => {
          const { action, why } = splitRecommendation(item);
          const focus = inferFocusTag(item);
          return (
            <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#121212",
                }}
              >
                {index + 1}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.6, color: "text.primary" }}>
                  {action}
                </Typography>
                {why && (
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                      WHY:
                    </Box>{" "}
                    {why}
                  </Typography>
                )}
                {focus && (
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.25 }}>
                    <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                      FOCUS:
                    </Box>{" "}
                    {focus}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

// Decorative nod to the app's 6-axis PerformanceRadar; skipped when reduced motion is requested.
function HexagonSketch() {
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      sx={{
        width: 40,
        height: 40,
        flexShrink: 0,
        color: "primary.main",
        animation: "aiInsightsHexPulse 2.4s ease-in-out infinite",
        "@keyframes aiInsightsHexPulse": {
          "0%, 100%": { opacity: 0.45 },
          "50%": { opacity: 1 },
        },
      }}
    >
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <line x1="24" y1="4" x2="24" y2="44" stroke="currentColor" strokeWidth={0.75} opacity={0.5} />
      <line x1="6" y1="14" x2="42" y2="34" stroke="currentColor" strokeWidth={0.75} opacity={0.5} />
      <line x1="42" y1="14" x2="6" y2="34" stroke="currentColor" strokeWidth={0.75} opacity={0.5} />
    </Box>
  );
}

// `progress` is pre-clamped by the caller, so it never stalls mid-value or loops back to 0.
function AnalysisProgress({ stageIndex, progress }: { stageIndex: number; progress: number }) {
  return (
    <Box sx={{ mt: 1, bgcolor: "background.paper", borderRadius: "6px", p: 2.5 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <HexagonSketch />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SectionLabel text="GENERATING AI REPORT" color="primary.main" />
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: "text.primary" }}>
            {LOADING_STAGES[stageIndex]}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1.25,
              height: 6,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
              "& .MuiLinearProgress-bar": { bgcolor: "primary.main", transition: "transform 0.3s linear" },
            }}
          />
          <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "text.secondary" }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function AiInsights({ playerId, matchId, onAnalysisRecorded }: AiInsightsProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  // Computed once since the staged animation is purely cosmetic - no need to react to the query changing mid-session.
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Guards against a stale request (e.g. a retry after an error) resolving after a newer one has started.
  const generationRef = useRef(0);

  // Ticks elapsedMs while loading so the staged panel derives both stage and progress from one clock.
  useEffect(() => {
    if (!loading || reducedMotion) return;
    const start = Date.now();
    const timer = window.setInterval(() => setElapsedMs(Date.now() - start), 50);
    return () => window.clearInterval(timer);
  }, [loading, reducedMotion]);

  const handleGenerate = async () => {
    const myGeneration = ++generationRef.current;
    setLoading(true);
    setError(null);
    setInsight(null);
    setRevealed(false);
    setElapsedMs(0);

    // Runs in parallel with the real request - only prevents the visuals from finishing early, never delays the network call.
    const minDurationPromise = reducedMotion
      ? Promise.resolve()
      : new Promise<void>((resolve) => setTimeout(resolve, MIN_SEQUENCE_MS));

    try {
      const [result] = await Promise.all([getInsights(playerId, matchId), minDurationPromise]);
      if (generationRef.current !== myGeneration) return;
      setInsight(sanitizeInsight(result));
      // Secondary write - never blocks or surfaces an error for the primary insight flow.
      recordAnalysis(playerId, matchId)
        .then(() => onAnalysisRecorded?.())
        .catch(() => {});
    } catch (err) {
      // Honors the minimum duration on failure too, so a fast error doesn't cut the staged sequence off mid-stage.
      await minDurationPromise;
      if (generationRef.current !== myGeneration) return;
      setError(getErrorMessage(err, "Could not generate insights for this match."));
    } finally {
      if (generationRef.current === myGeneration) {
        setLoading(false);
        if (reducedMotion) {
          setRevealed(true);
        } else {
          requestAnimationFrame(() => setRevealed(true));
        }
      }
    }
  };

  // Deterministic from playerId/matchId - no fetch needed, the analysis was persisted by the recordAnalysis call above.
  const handleCopyShareLink = async () => {
    const url = `${import.meta.env.VITE_SHARE_API_BASE_URL}/share/${encodeURIComponent(playerId)}/${encodeURIComponent(matchId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) - silently ignored, like this component's other secondary actions.
    }
  };

  // If the API resolves early, elapsedMs keeps advancing until `loading` flips false; if it takes
  // longer, both clamp at the last stage / 99% until the response lands.
  const stageIndex = Math.min(Math.floor(elapsedMs / STAGE_MS), LOADING_STAGES.length - 1);
  const progress = Math.min(99, (elapsedMs / MIN_SEQUENCE_MS) * 100);

  // Weaknesses (this match) and risk factors (an ongoing pattern) are distinct backend fields, kept as separate blocks.
  const strengthItems = insight ? insight.strengths.slice(0, MAX_STRENGTHS) : [];
  const hurtItems = insight ? insight.weaknesses.slice(0, MAX_HURT_ITEMS) : [];
  const riskFactorItems = insight ? insight.riskFactors.slice(0, MAX_RISK_FACTORS) : [];
  const hasStrengths = strengthItems.length > 0;
  const hasHurt = hurtItems.length > 0;
  const hasRiskFactors = riskFactorItems.length > 0;

  const topRecommendations = insight ? insight.recommendations.slice(0, MAX_RECOMMENDATIONS) : [];
  const trainingPriorities = insight ? insight.trainingPriorities.slice(0, MAX_TRAINING_PRIORITIES) : [];
  const hasDevelopment = !!insight && (insight.seasonProgress.length > 0 || trainingPriorities.length > 0);

  return (
    <Box sx={{ mt: 2 }}>
      {!insight && !loading && (
        <Button variant="outlined" size="small" onClick={handleGenerate} fullWidth>
          Generate AI Insights
        </Button>
      )}

      {loading &&
        (reducedMotion ? (
          <Box sx={{ mt: 1, bgcolor: "background.paper", borderRadius: "6px", p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
              Analyzing match and season performance...
            </Typography>
          </Box>
        ) : (
          <AnalysisProgress stageIndex={stageIndex} progress={progress} />
        ))}

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {insight && (
        <Box
          sx={{
            mt: 1,
            bgcolor: "background.paper",
            borderRadius: "6px",
            p: 2,
            ...(reducedMotion
              ? {}
              : {
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                }),
          }}
        >
          <SectionTitle>AI Insights</SectionTitle>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: -1, mb: 1.5 }}>
            Personalized analysis based on this match and current season performance.
          </Typography>
          {insight.source !== "gemini" && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Basic summary — AI is temporarily unavailable, showing a simplified breakdown instead
            </Typography>
          )}

          {insight.summary.length > 0 && <NarrativeCard label="OVERALL VERDICT" paragraph={insight.summary} />}

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
                <EvidenceList label="WHAT YOU DID WELL" items={strengthItems} glyph="✓" tone="success" />
              )}
              {hasHurt && (
                <EvidenceList label="WHAT HURT YOUR PERFORMANCE" items={hurtItems} glyph="!" tone="error" />
              )}
            </Box>
          )}

          {hasRiskFactors && (
            <Box sx={{ mt: 5 }}>
              <EvidenceList label="ONGOING RISK FACTORS" items={riskFactorItems} glyph="⚠" tone="warning" />
            </Box>
          )}

          {topRecommendations.length > 0 && <ActionPlan items={topRecommendations} />}

          {insight.playstyle.length > 0 && <NarrativeCard label="PLAYSTYLE DIAGNOSIS" paragraph={insight.playstyle} />}

          {hasDevelopment && (
            <NarrativeCard
              label="LONG-TERM DEVELOPMENT"
              paragraph={insight.seasonProgress.length > 0 ? insight.seasonProgress : undefined}
              rankedLines={trainingPriorities}
            />
          )}

          <Button
            variant="outlined"
            size="small"
            onClick={handleCopyShareLink}
            sx={{ mt: 2.5, fontWeight: 700 }}
          >
            {linkCopied ? "Link copied!" : "Copy Share Link"}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
