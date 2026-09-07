import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import { getErrorMessage } from "../utils/errorMessage";
import AiInsights from "./AiInsights";
import StatTile from "./StatTile";

// Only the most recent few matches get an automatic rich preview (map/mode/placement/
// kills/damage) - PUBG has no batch endpoint, so previewing N matches costs N API calls.
// Kept low because a single player search already costs 1 (player) + 1 (season stats,
// after caching the season id) + N (previews) calls against a 10 req/min free-tier limit.
// Matches beyond this are loaded lazily, one API call per click, instead of eagerly -
// see the older-match list below.
const PREVIEW_COUNT = 3;

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
  index: number;
  state: MatchState | undefined;
  selected: boolean;
  onClick: () => void;
}

function OlderMatchRow({ index, state, selected, onClick }: OlderMatchRowProps) {
  let content: ReactNode;
  if (state === "loading") {
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
  } else if (state === undefined) {
    content = (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: "4px",
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>
            {index}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Older match · tap to view placement, map and date
        </Typography>
      </Stack>
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
  const previewIds = matchIds.slice(0, PREVIEW_COUNT);
  const overflowIds = matchIds.slice(PREVIEW_COUNT);

  // Holds fetched state for ANY match, whether auto-previewed or lazily loaded from the
  // older-match list on click - one cache instead of separate preview/selected state, so
  // a match that's already been loaded once is never re-fetched.
  const [matchCache, setMatchCache] = useState<Record<string, MatchState>>(() =>
    Object.fromEntries(previewIds.map((id) => [id, "loading" as const]))
  );
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  useEffect(() => {
    matchIds.slice(0, PREVIEW_COUNT).forEach((matchId) => {
      getMatchStats(playerId, matchId)
        .then((match) => setMatchCache((prev) => ({ ...prev, [matchId]: match })))
        .catch(() => setMatchCache((prev) => ({ ...prev, [matchId]: "error" })));
    });
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
          {overflowIds.map((matchId, index) => (
            <OlderMatchRow
              key={matchId}
              index={PREVIEW_COUNT + index + 1}
              state={matchCache[matchId]}
              selected={matchId === selectedMatchId}
              onClick={() => handleSelect(matchId)}
            />
          ))}
        </Stack>
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
