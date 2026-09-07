import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { Alert, Box, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import StatTile from "./StatTile";

// The most recent matches get an automatic, immediate rich preview (map/mode/placement/
// kills/damage) - PUBG has no batch endpoint, so previewing N matches costs N API calls,
// and a single search already spends 1 (player) + 1 (season stats, after caching the
// season id) before this. Matches beyond this count still load automatically (see the
// background queue below), just paced out instead of firing all at once, to stay within
// PUBG's 10 req/min free-tier limit.
const PREVIEW_COUNT = 7;
// Cap on how many matches this component will ever fetch/show at all, regardless of how
// many PUBG actually returns for the player (up to ~14 days' worth, which can be dozens
// for an active player). Beyond real UX value at that point, and the background queue
// below would take a very long time - and risk far more 429s - trying to load all of
// them. matchIds is newest-first, so this keeps the most recent N and drops the rest.
const MAX_MATCHES_DISPLAYED = 50;
// Let the initial preview burst (player + season + previews, all fired together) clear
// PUBG's rate window before starting the background queue for older matches.
const BACKGROUND_LOAD_INITIAL_DELAY_MS = 8000;
// One call roughly every 9s is ~6.7/min from this queue alone - well under PUBG's 10/min
// limit even after accounting for the initial preview burst and the occasional retried
// click, which is what actually caused real 429s at the previous, tighter pacing.
const BACKGROUND_LOAD_INTERVAL_MS = 9000;
const RATE_LIMIT_DEFAULT_BACKOFF_MS = 20000;
const RATE_LIMIT_MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MatchListProps {
  playerId: string;
  matchIds: string[];
}

type MatchState = Match | "loading" | "error";

// Every card/row in this file rests on a transparent-vs-divider border and only turns
// primary (gold) when selected - one rule everywhere instead of some rows having no
// visible resting border and others having a gray one.
const restingBorderColor = "divider";

function formatMatchDate(createdAt: string, includeTime = false): string {
  const date = new Date(createdAt);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (!includeTime) return dateLabel;
  const timeLabel = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}, ${timeLabel}`;
}

interface MatchPreviewCardProps {
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function MatchPreviewCard({ state, selected, onClick }: MatchPreviewCardProps) {
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
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatMatchDate(state.createdAt)} · #{state.winPlace}
        </Typography>
        <Chip label={state.gameMode} size="small" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {state.mapName}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {state.kills} kills
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {state.damageDealt.toFixed(0)} dmg
        </Typography>
      </Stack>
    </Box>
  );
}

interface OlderMatchRowProps {
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function OlderMatchRow({ state, selected, onClick }: OlderMatchRowProps) {
  let content: ReactNode;
  // Undefined (not yet reached by the background queue) renders the same as "loading" -
  // it's about to load on its own shortly, so there's no useful distinction to show the
  // user, and no "tap to load" prompt needed since a tap is no longer required.
  if (state === "loading" || state === undefined) {
    content = <Skeleton variant="text" width="55%" height={18} />;
  } else if (state === "error") {
    content = (
      <Typography variant="caption" color="text.secondary">
        ⚠ Couldn't load ·{" "}
        <Typography component="span" variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
          tap to retry
        </Typography>
      </Typography>
    );
  } else {
    content = (
      <Typography variant="caption">
        {formatMatchDate(state.createdAt, true)} · #{state.winPlace} · {state.mapName} · {state.gameMode}
      </Typography>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 1.5,
        py: 1,
        borderRadius: "6px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: selected ? "primary.main" : restingBorderColor,
        cursor: "pointer",
      }}
    >
      {content}
    </Box>
  );
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
  const previewIds = displayedIds.slice(0, PREVIEW_COUNT);
  const overflowIds = displayedIds.slice(PREVIEW_COUNT);

  // Holds fetched state for ANY match, whether auto-previewed or lazily loaded from the
  // older-match list on click - one cache instead of separate preview/selected state, so
  // a match that's already been loaded once is never re-fetched.
  const [matchCache, setMatchCache] = useState<Record<string, MatchState>>(() =>
    Object.fromEntries(previewIds.map((id) => [id, "loading" as const]))
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  // Lets the background queue below read the latest cache without being a dependency of
  // its effect (adding matchCache there would restart the queue on every single fetch).
  const matchCacheRef = useRef(matchCache);
  useEffect(() => {
    matchCacheRef.current = matchCache;
  }, [matchCache]);

  useEffect(() => {
    // PREVIEW_COUNT is always far smaller than MAX_MATCHES_DISPLAYED, so slicing matchIds
    // directly (rather than the outer displayedIds/previewIds) gives the same result
    // without adding a non-primitive dependency that would re-run this every render.
    matchIds.slice(0, PREVIEW_COUNT).forEach((matchId) => {
      getMatchStats(playerId, matchId)
        .then((match) => setMatchCache((prev) => ({ ...prev, [matchId]: match })))
        .catch(() => setMatchCache((prev) => ({ ...prev, [matchId]: "error" })));
    });
  }, [playerId, matchIds]);

  // Auto-loads every older match too, just paced out instead of firing all at once - see
  // the constants above for why. A click (handleSelect) can still jump ahead of this
  // queue for one specific match; this loop simply skips anything already loaded,
  // in-flight, or already claimed by a click by the time it gets to it.
  useEffect(() => {
    let cancelled = false;

    async function loadWithRateLimitRetry(matchId: string, attempt: number) {
      setMatchCache((prev) => ({ ...prev, [matchId]: "loading" }));
      try {
        const result = await getMatchStats(playerId, matchId);
        if (!cancelled) setMatchCache((prev) => ({ ...prev, [matchId]: result }));
      } catch (err) {
        const isRateLimited = axios.isAxiosError(err) && err.response?.status === 429;
        if (isRateLimited && attempt < RATE_LIMIT_MAX_RETRIES) {
          const retryAfterHeader = err.response?.headers?.["retry-after"];
          const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : NaN;
          await sleep(Number.isFinite(retryAfterMs) ? retryAfterMs : RATE_LIMIT_DEFAULT_BACKOFF_MS);
          if (!cancelled) await loadWithRateLimitRetry(matchId, attempt + 1);
          return;
        }
        if (!cancelled) setMatchCache((prev) => ({ ...prev, [matchId]: "error" }));
      }
    }

    async function runQueue() {
      for (const matchId of matchIds.slice(PREVIEW_COUNT, MAX_MATCHES_DISPLAYED)) {
        if (cancelled) return;
        const current = matchCacheRef.current[matchId];
        // Only an untouched or previously-failed entry is this queue's to fetch - anything
        // "loading" is already being handled (by a click, or an earlier pass of this loop).
        if (current === undefined || current === "error") {
          await loadWithRateLimitRetry(matchId, 0);
        }
        if (cancelled) return;
        await sleep(BACKGROUND_LOAD_INTERVAL_MS);
      }
    }

    const startTimer = setTimeout(runQueue, BACKGROUND_LOAD_INITIAL_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [playerId, matchIds]);

  // Also doubles as the retry action: clicking an already-failed card/row re-runs this,
  // and since its cache entry is "error" (not a loaded Match), the guard below falls
  // through to a fresh fetch instead of returning early.
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

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {previewIds.map((matchId) => (
          <MatchPreviewCard
            key={matchId}
            state={matchCache[matchId]}
            selected={matchId === selectedMatchId}
            onClick={() => handleSelect(matchId)}
          />
        ))}
      </Box>

      {overflowIds.length > 0 && (
        <Stack
          spacing={0.75}
          sx={{
            mt: 1.5,
            maxHeight: 200,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          {overflowIds.map((matchId) => (
            <OlderMatchRow
              key={matchId}
              state={matchCache[matchId]}
              selected={matchId === selectedMatchId}
              onClick={() => handleSelect(matchId)}
            />
          ))}
        </Stack>
      )}

      {hiddenCount > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Showing the {MAX_MATCHES_DISPLAYED} most recent matches ({hiddenCount} older not shown).
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }} sx={{ alignItems: { sm: "center" } }}>
            <Box sx={{ minWidth: 90 }}>
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
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {selectedMatch.mapName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={selectedMatch.gameMode} size="small" />
                <Typography variant="caption" color="text.secondary">
                  {formatMatchDate(selectedMatch.createdAt, true)}
                </Typography>
              </Stack>
            </Box>
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

          {selectedMatchId && <AiInsights playerId={playerId} matchId={selectedMatchId} />}
        </Box>
      )}
    </Box>
  );
}

export default MatchList;
