import { useEffect, useRef, useState } from "react";
import { Alert, Box, Chip, Divider, Pagination, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import type { SeasonStats } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import PopulationComparison from "./PopulationComparison";
import StatTile from "./StatTile";
import WeaponBreakdown from "./WeaponBreakdown";

// Threshold before attributing a slow load to the rate limiter rather than a stall.
const SLOW_LOAD_WARNING_MS = 4000;

// matchIds is newest-first, so capping here keeps the most recent N matches.
const MAX_MATCHES_DISPLAYED = 50;
// Kept under the free-tier rate limit so a single page turn can't trigger a 429.
const PAGE_SIZE = 6;

// Matches DeltaIndicator's slide/fade-in so both "vs season average" displays read consistently.
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`;

interface MatchListProps {
  playerId: string;
  matchIds: string[];
  seasonStats: SeasonStats | null;
  onAnalysisRecorded?: () => void;
}

type MatchState = Match | "loading" | "error";

const restingBorderColor = "divider";

function formatMatchDate(createdAt: string, includeTime = false): string {
  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!includeTime) return dateLabel;
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}, ${timeLabel}`;
}

// Reused as the app's one signature marker shape rather than introducing a new glyph per context.
function DiamondMarker({ size = 8 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "2px",
        bgcolor: "primary.main",
        transform: "rotate(45deg)",
        flexShrink: 0,
      }}
    />
  );
}

interface MatchCardProps {
  state: MatchState | undefined;
  selected: boolean;
  seasonStats: SeasonStats | null;
  onClick: () => void;
}

// Thresholds compare against the player's own season average damage, not a fabricated/population cutoff.
const STANDOUT_DAMAGE_MULTIPLIER = 1.5;
const BELOW_AVERAGE_DAMAGE_MULTIPLIER = 0.5;

function MatchCard({ state, selected, seasonStats, onClick }: MatchCardProps) {
  if (state === undefined || state === "loading") {
    return (
      <Box sx={{ p: 2, borderRadius: "6px", bgcolor: "background.default", minHeight: 84 }}>
        <Skeleton variant="text" width="60%" height={22} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box
        onClick={onClick}
        sx={{
          p: 2,
          borderRadius: "6px",
          bgcolor: "background.default",
          minHeight: 84,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          ⚠ Couldn't load this match
        </Typography>
        <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
          Tap to retry
        </Typography>
      </Box>
    );
  }

  // Reuses the existing "Top 10" season stat rather than inventing a new threshold.
  const isTopTen = state.winPlace <= 10;
  const isStandout = !!seasonStats && seasonStats.avgDamage > 0
    && state.damageDealt >= seasonStats.avgDamage * STANDOUT_DAMAGE_MULTIPLIER;
  const isBelowAverage = !!seasonStats && seasonStats.avgDamage > 0
    && state.damageDealt <= seasonStats.avgDamage * BELOW_AVERAGE_DAMAGE_MULTIPLIER;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : restingBorderColor,
        borderLeftWidth: isTopTen ? 4 : 1,
        borderLeftColor: isTopTen && !selected ? "primary.main" : undefined,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 84,
        transition: "transform 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "primary.main",
        },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: isTopTen ? "primary.main" : "text.primary" }}>
            #{state.winPlace}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatMatchDate(state.createdAt)}
          </Typography>
          {isStandout && <DiamondMarker />}
        </Stack>
        <Chip label={state.gameMode} size="small" />
      </Stack>

      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {state.mapName}
      </Typography>

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end", mt: "auto", opacity: isBelowAverage ? 0.6 : 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {state.kills}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Kills
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {state.damageDealt.toFixed(0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Damage
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

interface DeltaMetric {
  label: string;
  matchValue: number;
  seasonAvg: number;
}

// Skips metrics with a zero season average to avoid a division-by-zero/Infinity percentage.
function buildDeltaTiles(metrics: DeltaMetric[]) {
  return metrics
    .filter((metric) => metric.seasonAvg !== 0)
    .map((metric, index) => {
      const pct = ((metric.matchValue - metric.seasonAvg) / metric.seasonAvg) * 100;
      const isBetter = pct >= 0;
      return (
        <Box
          key={metric.label}
          sx={{
            bgcolor: "background.paper",
            borderRadius: "6px",
            py: 1.5,
            px: 1,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              lineHeight: 1,
              color: isBetter ? "success.main" : "error.main",
              animation: `${slideIn} 0.4s ease-out ${index * 0.08}s both`,
            }}
          >
            {isBetter ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            {metric.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            vs season average
          </Typography>
        </Box>
      );
    });
}

function SelectedMatchSkeleton() {
  return (
    <Box sx={{ mt: 2, bgcolor: "background.default", borderRadius: "6px", p: 2.5 }}>
      <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
        <Skeleton variant="text" width={70} height={56} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="30%" height={18} sx={{ mt: 0.5 }} />
        </Box>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: "6px" }} />
        ))}
      </Box>
    </Box>
  );
}

function MatchList({ playerId, matchIds, seasonStats, onAnalysisRecorded }: MatchListProps) {
  const displayedIds = matchIds.slice(0, MAX_MATCHES_DISPLAYED);
  const hiddenCount = matchIds.length - displayedIds.length;
  const pageCount = Math.max(1, Math.ceil(displayedIds.length / PAGE_SIZE));

  const [page, setPage] = useState(0);
  const pageIds = displayedIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Caches every match fetched so far so revisiting a page never re-fetches it.
  const [matchCache, setMatchCache] = useState<Record<string, MatchState>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const [showSlowLoadNotice, setShowSlowLoadNotice] = useState(false);

  // Lets the fetch effect read the latest cache without depending on matchCache (which would re-run on every result).
  const matchCacheRef = useRef(matchCache);
  useEffect(() => {
    matchCacheRef.current = matchCache;
  }, [matchCache]);

  useEffect(() => {
    const idsForThisPage = matchIds.slice(0, MAX_MATCHES_DISPLAYED).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    idsForThisPage.forEach((matchId) => {
      const current = matchCacheRef.current[matchId];
      if (current !== undefined && current !== "error") return;

      setMatchCache((prev) => ({ ...prev, [matchId]: "loading" }));
      getMatchStats(playerId, matchId)
        .then((match) => setMatchCache((prev) => ({ ...prev, [matchId]: match })))
        .catch(() => setMatchCache((prev) => ({ ...prev, [matchId]: "error" })));
    });
  }, [playerId, matchIds, page]);

  const isPageLoading = pageIds.some((matchId) => {
    const state = matchCache[matchId];
    return state === undefined || state === "loading";
  });

  useEffect(() => {
    if (!isPageLoading) return;
    const timer = setTimeout(() => setShowSlowLoadNotice(true), SLOW_LOAD_WARNING_MS);
    return () => {
      clearTimeout(timer);
      setShowSlowLoadNotice(false);
    };
  }, [isPageLoading, page]);

  // Also doubles as the retry action: an errored cache entry falls through to a fresh fetch instead of returning early.
  const handleSelect = async (matchId: string) => {
    setSelectedMatchId(matchId);
    setSelectedError(null);

    const cached = matchCache[matchId];
    if (cached && cached !== "error") {
      return;
    }

    setMatchCache((prev) => ({ ...prev, [matchId]: "loading" }));
    try {
      const result = await getMatchStats(playerId, matchId);
      setMatchCache((prev) => ({ ...prev, [matchId]: result }));
    } catch (err) {
      setMatchCache((prev) => ({ ...prev, [matchId]: "error" }));
      setSelectedError(getErrorMessage(err, "This match could not be found for this player."));
    }
  };

  if (matchIds.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No recent matches (PUBG only exposes roughly the last 14 days).
      </Typography>
    );
  }

  const selectedState = selectedMatchId ? matchCache[selectedMatchId] : undefined;
  const selectedMatch = selectedState && selectedState !== "loading" && selectedState !== "error" ? selectedState : null;

  const seasonDeltaTiles =
    selectedMatch && seasonStats
      ? buildDeltaTiles([
          { label: "Damage dealt", matchValue: selectedMatch.damageDealt, seasonAvg: seasonStats.avgDamage },
          {
            label: "Time survived",
            matchValue: selectedMatch.timeSurvivedSeconds,
            seasonAvg: seasonStats.avgSurvivalSeconds,
          },
          { label: "Headshot rate", matchValue: selectedMatch.headshotRate, seasonAvg: seasonStats.headshotRate },
        ])
      : [];

  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1 }}>
        <Tooltip
          title="Match data loads live from PUBG's own API, which limits how many requests
            can be made per minute — loading can take a few seconds per match. This is a
            PUBG platform limit, not an app performance issue."
          arrow
        >
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ cursor: "default", borderBottom: "1px dotted", borderColor: "text.secondary" }}
          >
            ⓘ Why this can take a moment
          </Typography>
        </Tooltip>
      </Stack>

      {showSlowLoadNotice && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Still loading — PUBG's shared rate limit means this page can take up to ~10
          seconds when a lot of requests are queued. Hang tight, it will finish shortly.
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {pageIds.map((matchId) => (
          <MatchCard
            key={matchId}
            state={matchCache[matchId]}
            selected={matchId === selectedMatchId}
            seasonStats={seasonStats}
            onClick={() => handleSelect(matchId)}
          />
        ))}
      </Box>

      {pageCount > 1 && (
        <Stack direction="row" sx={{ justifyContent: "center", mt: 1.5 }}>
          <Pagination
            count={pageCount}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            size="small"
            color="primary"
          />
        </Stack>
      )}

      {hiddenCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
          Showing the {MAX_MATCHES_DISPLAYED} most recent matches
        </Typography>
      )}

      {selectedState === "loading" && <SelectedMatchSkeleton />}

      {selectedError && selectedState === "error" && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {selectedError}
        </Alert>
      )}

      {selectedMatch && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 800, letterSpacing: 1, color: "primary.main", mb: 1 }}
          >
            MATCH ANALYSIS
          </Typography>
          <Box
            sx={{
              bgcolor: "background.paper",
              borderRadius: "6px",
              borderTop: "2px solid",
              borderColor: "primary.main",
              p: 2.5,
            }}
          >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ alignItems: { xs: "center", sm: "center" }, textAlign: { xs: "center", sm: "left" } }}
          >
            <Box sx={{ minWidth: { sm: 90 } }}>
              <Typography variant="overline" color="text.secondary">
                Placement
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1,
                  color: selectedMatch.winPlace === 1 ? "primary.main" : "text.primary",
                }}
              >
                #{selectedMatch.winPlace}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, textAlign: "center" }}>
              <Typography variant="overline" color="text.secondary">
                Map
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: -0.5 }}>
                {selectedMatch.mapName}
              </Typography>
            </Box>

            <Stack
              spacing={0.5}
              sx={{ alignItems: { xs: "center", sm: "flex-end" }, minWidth: { sm: 140 } }}
            >
              <Chip label={`Mode: ${selectedMatch.gameMode}`} size="small" />
              <Typography variant="caption" color="text.secondary">
                {formatMatchDate(selectedMatch.createdAt, true)}
              </Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="overline" color="text.secondary">
            Combat &amp; Survival
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 1.5,
              mt: 1,
            }}
          >
            <StatTile label="Kills" value={selectedMatch.kills} />
            <StatTile label="Headshot" value={`${(selectedMatch.headshotRate * 100).toFixed(0)}%`} />
            <StatTile label="Damage" value={selectedMatch.damageDealt.toFixed(0)} />
            <StatTile label="Survived" value={`${Math.round(selectedMatch.timeSurvivedSeconds / 60)}m`} />
          </Box>

          {seasonDeltaTiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Comparisons
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                  mt: 0.5,
                }}
              >
                {seasonDeltaTiles}
                {selectedMatchId && (
                  <PopulationComparison key={`population-${selectedMatchId}`} playerId={playerId} matchId={selectedMatchId} />
                )}
              </Box>
            </Box>
          )}

          {selectedMatchId && (
            <WeaponBreakdown key={`weapons-${selectedMatchId}`} playerId={playerId} matchId={selectedMatchId} />
          )}

          {selectedMatchId && (
            <AiInsights
              key={`insights-${selectedMatchId}`}
              playerId={playerId}
              matchId={selectedMatchId}
              onAnalysisRecorded={onAnalysisRecorded}
            />
          )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MatchList;
