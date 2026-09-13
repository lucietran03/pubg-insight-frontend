import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getInsights } from "../services/insightService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";
import SectionTitle from "./SectionTitle";

interface AiInsightsProps {
  playerId: string;
  matchId: string;
}

// Sequential messages shown while the real `getInsights` request is in flight. These are
// purely narrative - the backend does one call, not seven - but staging the wait like this
// (see handleGenerate below) reads as "an analysis pipeline is running" instead of "a
// spinner is frozen", which is the whole point of this loading experience.
const LOADING_STAGES = [
  "Connecting to performance data...",
  "Fetching recent match history...",
  "Computing season baselines...",
  "Comparing match performance...",
  "Analyzing player archetype...",
  "Generating coaching recommendations...",
  "Finalizing AI report...",
];

// Minimum wall-clock time the staged sequence plays for, regardless of how fast the real
// API responds - long enough to read a couple of stages, short enough not to feel slow.
// The real request runs in parallel with this (see handleGenerate), never after it.
const MIN_SEQUENCE_MS = 2800;
const STAGE_MS = MIN_SEQUENCE_MS / LOADING_STAGES.length;

// Content density caps - the brief asks for a short, punchy report rather than a wall of
// text, even when the backend/Gemini produced a longer list. Arrays are already returned
// in the backend's own priority order, so keeping the first N keeps the most important
// items.
const MAX_STRENGTHS = 4;
const MAX_HURT_ITEMS = 3;
const MAX_RECOMMENDATIONS = 3;
const MAX_TRAINING_PRIORITIES = 3;

function capitalizeFragment(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Strengths/weaknesses/risk factors each arrive as a single already-written sentence
// (Gemini's prompt asks it to reference real match/season numbers inline) rather than a
// structured {title, evidence} shape. This splits a sentence at its first clause boundary
// whose trailing half contains a digit - a decent signal that half is the numeric
// "evidence" rather than just a second descriptive clause. When no such boundary exists,
// the whole sentence is kept as the title with no evidence line, instead of forcing a split.
function splitEvidence(sentence: string): { title: string; evidence: string | null } {
  const trimmed = sentence.trim();
  const delimiters = [";", " — ", " - ", ": ", ", "];
  for (const delimiter of delimiters) {
    const idx = trimmed.indexOf(delimiter);
    if (idx > 8 && idx < trimmed.length - 3) {
      const before = trimmed.slice(0, idx).trim();
      const after = trimmed.slice(idx + delimiter.length).trim();
      if (before.length > 0 && after.length > 2 && /\d/.test(after)) {
        return { title: before, evidence: capitalizeFragment(after.replace(/\.$/, "")) };
      }
    }
  }
  return { title: trimmed, evidence: null };
}

// Recommendations are also single sentences. Some already contain their own rationale
// clause (e.g. "..., because ..." / "... - your strongest matches..." / "practice aim to
// improve headshot rate"); when that pattern exists it's split into the action + a WHY
// line instead of inventing a generic reason for every item. " to " is checked last (lowest
// priority) since it's the most common real phrasing (both Gemini and the offline fallback
// writer produce "<action> to <purpose>" sentences) but the least specific marker.
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
        return { action, why: capitalizeFragment(why) };
      }
    }
  }
  return { action: trimmed, why: null };
}

// FOCUS is a short tag inferred from keywords actually present in the recommendation's own
// text (not a separate field) - an honest derivation from the string, not a fabricated one.
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

// Small eyebrow-style label reused across the report's sub-sections.
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

// Pattern A - NARRATIVE CARD. Shared by Overall Verdict, Playstyle Diagnosis and
// Long-term Development so all three read as the same kind of block (border + tinted
// background + label + prose) instead of each inventing its own look (bare headline vs
// italic blockquote vs paragraph+bullets, as before). `rankedLines` lets
// Long-term Development fold its trainingPriorities array in as short ranked lines under
// the paragraph rather than breaking into a different structural pattern.
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

// Pattern B - EVIDENCE LIST. Shared by "What You Did Well" (strengths) and "What Hurt
// Your Performance" (weaknesses + riskFactors). Each item renders as a title line plus an
// optional evidence line underneath (see splitEvidence), so both columns read the same way.
function EvidenceList({
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
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
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

// Pattern C - ACTION PLAN. Used only for Key Coaching Advice (recommendations). Each
// ranked step shows the action, and - only where the sentence itself supports it - a WHY
// line (the recommendation's own rationale clause) and a FOCUS tag (inferred from keywords
// in that same sentence). Items that don't cleanly split just render the numbered action
// alone rather than a fabricated generic WHY/FOCUS.
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
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.6 }}>
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

// Small decorative hexagon/radar-outline sketch for the loading state - a simplified nod
// to the app's 6-axis PerformanceRadar (not the real component), pulsing subtly via CSS
// opacity only. Only ever mounted when reduced motion is not requested (see render below).
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

// Staged, "tactical" loading panel: hexagon sketch + current stage message + a determinate
// progress bar. `progress` is pre-clamped by the caller (never shown at a stalled
// mid-value forever, never loops back to 0 - see handleGenerate/elapsedMs below).
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

function AiInsights({ playerId, matchId }: AiInsightsProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Drives the fade/slide-in transition once a result or error is ready to display.
  const [revealed, setRevealed] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Computed once via a lazy initializer - the staged animation is purely cosmetic, so
  // there's no need to react to the media query changing mid-session.
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Guards against a stale request (e.g. a retry after an error) resolving after a newer
  // one has already started.
  const generationRef = useRef(0);

  // Ticks elapsedMs while loading so the staged panel can derive both the current stage
  // message and the progress percentage from a single clock.
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

    // The staged visual sequence and the real request run in parallel, not sequentially -
    // this promise is only ever used to make sure the visuals don't finish *before* the
    // minimum duration, never to delay the actual network call.
    const minDurationPromise = reducedMotion
      ? Promise.resolve()
      : new Promise<void>((resolve) => setTimeout(resolve, MIN_SEQUENCE_MS));

    try {
      const [result] = await Promise.all([getInsights(playerId, matchId), minDurationPromise]);
      if (generationRef.current !== myGeneration) return;
      setInsight(result);
    } catch (err) {
      // Still honor the minimum visual duration on failure - otherwise a fast error would
      // cancel the staged sequence mid-stage instead of finishing it.
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

  // If the real API resolves before MIN_SEQUENCE_MS, elapsedMs keeps advancing (the
  // interval only stops when `loading` flips false) so the stage/progress still read
  // naturally up to ~100%. If the API takes longer than MIN_SEQUENCE_MS, both clamp to
  // the last stage / 99% - held there (not looping, not stuck mid-bar) until the response
  // lands and `loading` flips false.
  const stageIndex = Math.min(Math.floor(elapsedMs / STAGE_MS), LOADING_STAGES.length - 1);
  const progress = Math.min(99, (elapsedMs / MIN_SEQUENCE_MS) * 100);

  // "Hurt" side of the review pairing folds risk factors in after weaknesses - both are
  // negative signals, weaknesses first since they're the direct, already-prioritized read
  // on the match, risk factors appended as broader concerns. Capped per MAX_HURT_ITEMS.
  const strengthItems = insight ? insight.strengths.slice(0, MAX_STRENGTHS) : [];
  const hurtItems = insight ? [...insight.weaknesses, ...insight.riskFactors].slice(0, MAX_HURT_ITEMS) : [];
  const hasStrengths = strengthItems.length > 0;
  const hasHurt = hurtItems.length > 0;

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

          {/* Overall Verdict - Pattern A (Narrative Card). */}
          {insight.summary.length > 0 && <NarrativeCard label="OVERALL VERDICT" paragraph={insight.summary} />}

          {/* What You Did Well / What Hurt Your Performance - Pattern B (Evidence List),
              paired side-by-side on wider screens with a clear green-vs-red visual language. */}
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

          {/* Key Coaching Advice - Pattern C (Action Plan). */}
          {topRecommendations.length > 0 && <ActionPlan items={topRecommendations} />}

          {/* Playstyle Diagnosis - Pattern A (Narrative Card). */}
          {insight.playstyle.length > 0 && <NarrativeCard label="PLAYSTYLE DIAGNOSIS" paragraph={insight.playstyle} />}

          {/* Long-term Development - Pattern A (Narrative Card), with trainingPriorities
              folded in as ranked lines under the season-progress paragraph rather than a
              separate structural pattern. */}
          {hasDevelopment && (
            <NarrativeCard
              label="LONG-TERM DEVELOPMENT"
              paragraph={insight.seasonProgress.length > 0 ? insight.seasonProgress : undefined}
              rankedLines={trainingPriorities}
            />
          )}
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
