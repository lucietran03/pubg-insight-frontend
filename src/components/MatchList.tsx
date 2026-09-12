import { useEffect, useRef, useState } from "react";
import { Alert, Box, Chip, Divider, Pagination, Skeleton, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import { getSeasonStats } from "../services/seasonStatsService";
import type { Match } from "../types/match";
import type { SeasonStats } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import StatTile from "./StatTile";

// How long a page's match fetch must be in flight before we tell the user it's the
// backend's blocking rate limiter (not a stall) - short enough to reassure on a slow
// page, long enough not to flash on a normal fast load.
const SLOW_LOAD_WARNING_MS = 4000;

// Cap on how many matches this component will ever page through, regardless of how many
// PUBG actually returns for the player (up to ~14 days' worth, which can be dozens for
// an active player) - beyond this there's little real value and PUBG's own match history
// window is already short-lived. matchIds is newest-first, so this keeps the most recent
// N and drops the rest.
const MAX_MATCHES_DISPLAYED = 50;
// One page = one grid row set on desktop (3 columns) - PUBG has no batch endpoint, so
// turning a page costs this many API calls. Kept well under the 10 req/min free-tier
// limit so a single page turn never risks a 429 by itself.
const PAGE_SIZE = 6;

interface MatchListProps {
  playerId: string;
  matchIds: string[];
}

type MatchState = Match | "loading" | "error";

// Every card in this file rests on a transparent-vs-divider border and only turns
// primary (gold) when selected - one rule everywhere instead of some cards having no
// visible resting border and others having a gray one.
const restingBorderColor = "divider";

function formatMatchDate(createdAt: string, includeTime = false): string {
  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!includeTime) return dateLabel;
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}, ${timeLabel}`;
}

interface MatchCardProps {
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function MatchCard({ state, selected, onClick }: MatchCardProps) {
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

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : restingBorderColor,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 84,
      }}
    >
      {/* Top: placement + date on the left, mode badge on the right. */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            #{state.winPlace}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatMatchDate(state.createdAt)}
          </Typography>
        </Stack>
        <Chip label={state.gameMode} size="small" />
      </Stack>

      {/* Middle: the map gets its own line and visual room. */}
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {state.mapName}
      </Typography>

      {/* Bottom: kills left, damage right, so matches can be scanned at a glance. */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end", mt: "auto" }}>
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

// Renders one compact tile per metric, comparing this match's value against the player's
// season average. Metrics with a zero season average are skipped entirely (division by
// zero would produce a meaningless/Infinity percentage).
function buildDeltaTiles(metrics: DeltaMetric[]) {
  return metrics
    .filter((metric) => metric.seasonAvg !== 0)
    .map((metric) => {
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
          {/* Largest: the percentage is the key insight, so it dominates visually. */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, lineHeight: 1, color: isBetter ? "success.main" : "error.main" }}
          >
            {isBetter ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
          </Typography>
          {/* Secondary: which metric this is. */}
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
            {metric.label}
          </Typography>
          {/* Caption: the comparison basis, smallest. */}
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

function MatchList({ playerId, matchIds }: MatchListProps) {
  const displayedIds = matchIds.slice(0, MAX_MATCHES_DISPLAYED);
  const hiddenCount = matchIds.length - displayedIds.length;
  const pageCount = Math.max(1, Math.ceil(displayedIds.length / PAGE_SIZE));

  const [page, setPage] = useState(0);
  const pageIds = displayedIds.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Holds fetched state for every match visited so far across all pages, so paging back
  // to a page already seen never re-fetches it.
  const [matchCache, setMatchCache] = useState<Record<string, MatchState>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  // Season stats are only needed once a match is selected (for the delta chips below), so
  // we deliberately skip fetching them on initial page load to stay within the shared
  // rate-limit budget. Fetched once per player search and cached in state - re-selecting
  // a different match never re-fetches it.
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const seasonStatsFetchedRef = useRef(false);

  const [showSlowLoadNotice, setShowSlowLoadNotice] = useState(false);

  // Lets the page-fetch effect below read the latest cache without needing matchCache
  // itself as a dependency (which would re-run the fetch on every single result).
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

  // True while any card on the current page is still waiting on its PUBG fetch.
  const isPageLoading = pageIds.some((matchId) => {
    const state = matchCache[matchId];
    return state === undefined || state === "loading";
  });

  // Starts a timer as soon as the page's fetches go in flight; if they're still not done
  // after SLOW_LOAD_WARNING_MS, the backend's blocking rate limiter is almost certainly
  // queuing this page's requests, so we surface a more specific message. Cleared as soon
  // as loading finishes (isPageLoading flips false) or the page changes.
  useEffect(() => {
    if (!isPageLoading) return;
    const timer = setTimeout(() => setShowSlowLoadNotice(true), SLOW_LOAD_WARNING_MS);
    return () => {
      clearTimeout(timer);
      setShowSlowLoadNotice(false);
    };
  }, [isPageLoading, page]);

  // Also doubles as the retry action: clicking an already-failed card re-runs this, and
  // since its cache entry is "error" (not a loaded Match), the guard below falls through
  // to a fresh fetch instead of returning early.
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

  // Fires once, the first time a match is selected - not on initial page load. This is a
  // deliberate one-time extra PUBG call per player search (acceptable against the shared
  // rate-limit budget) so the delta chips below have something to compare against.
  useEffect(() => {
    if (selectedMatchId === null || seasonStatsFetchedRef.current) return;
    seasonStatsFetchedRef.current = true;
    getSeasonStats(playerId)
      .then(setSeasonStats)
      .catch(() => {
        // Non-critical: the delta chips simply won't render without season stats.
      });
  }, [selectedMatchId, playerId]);

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
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Match data loads live from PUBG's own API, which limits how many requests can be
        made per minute — loading can take a few seconds per match. This is a PUBG
        platform limit, not an app performance issue.
      </Typography>

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
        <Box sx={{ mt: 2, bgcolor: "background.default", borderRadius: "6px", p: 2.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ alignItems: { xs: "center", sm: "center" }, textAlign: { xs: "center", sm: "left" } }}
          >
            {/* LEFT: placement is the unambiguous visual anchor. */}
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

            {/* CENTER: the map. */}
            <Box sx={{ flexGrow: 1, textAlign: "center" }}>
              <Typography variant="overline" color="text.secondary">
                Map
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: -0.5 }}>
                {selectedMatch.mapName}
              </Typography>
            </Box>

            {/* RIGHT: mode badge + date. */}
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
                Vs Season Average
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
              </Box>
            </Box>
          )}

          {selectedMatchId && <AiInsights key={selectedMatchId} playerId={playerId} matchId={selectedMatchId} />}
        </Box>
      )}
    </Box>
  );
}

export default MatchList;
