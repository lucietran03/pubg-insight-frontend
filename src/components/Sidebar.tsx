import { useEffect, useState } from "react";
import { Box, Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { getHistory } from "../services/historyService";
import type { AnalysisHistoryEntry } from "../types/history";
import type { Player } from "../types/player";

interface SidebarProps {
  name: string;
  onNameChange: (name: string) => void;
  onSearch: () => void;
  loading: boolean;
  player: Player | null;
  backendOnline: boolean | null;
  historyRefreshToken: number;
}

const MAX_HISTORY_ITEMS = 5;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function HistoryItem({ entry }: { entry: AnalysisHistoryEntry }) {
  return (
    <Box
      sx={{
        py: 1.25,
        pl: 1,
        borderLeft: "2px solid",
        borderColor: "transparent",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {entry.mapName} · {entry.gameMode}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {relativeTime(entry.createdAt)}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        #{entry.winPlace} · {entry.kills} kills · {Math.round(entry.damageDealt)} dmg ·{" "}
        {Math.round(entry.headshotRate * 100)}% HS
      </Typography>
      {entry.insightSummary && (
        <Typography
          variant="caption"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mt: 0.5,
            color: "text.secondary",
            lineHeight: 1.4,
          }}
        >
          {entry.insightSummary}
        </Typography>
      )}
    </Box>
  );
}

// Scoped to the currently searched player - the backend's DynamoDB table is keyed by
// (playerId, matchId), so no cross-player query exists without a schema change.
function RecentlyAnalyzed({ player, historyRefreshToken }: { player: Player; historyRefreshToken: number }) {
  const [entries, setEntries] = useState<AnalysisHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    getHistory(player.id)
      .then((result) => {
        if (cancelled) return;
        // Not sorted by recency server-side (DynamoDB sort key is matchId, not createdAt).
        const sorted = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setEntries(sorted.slice(0, MAX_HISTORY_ITEMS));
      })
      .catch(() => {
        // Soft-fail, consistent with WeaponBreakdown/AiInsights secondary-data conventions.
      });

    return () => {
      cancelled = true;
    };
  }, [player.id, historyRefreshToken]);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", textTransform: "uppercase" }}
      >
        Recently Analyzed
      </Typography>
      <Stack sx={{ mt: 1 }} divider={<Divider />}>
        {entries.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No past analyses yet - generate an AI Insight to start building history.
          </Typography>
        ) : (
          entries.map((entry) => <HistoryItem key={entry.matchId} entry={entry} />)
        )}
      </Stack>
    </Box>
  );
}

function Sidebar({
  name,
  onNameChange,
  onSearch,
  loading,
  player,
  backendOnline,
  historyRefreshToken,
}: SidebarProps) {
  const statusColor =
    backendOnline === null ? "text.disabled" : backendOnline ? "success.main" : "error.main";
  const statusLabel =
    backendOnline === null ? "Checking API..." : backendOnline ? "API Online" : "API Offline";

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 380 },
        flexShrink: 0,
        borderRight: { md: "1px solid" },
        borderBottom: { xs: "1px solid", md: "none" },
        borderColor: "divider",
        p: { xs: 2, md: 3 },
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>
        PUBG INSIGHT
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5, mb: 2 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: statusColor }} />
        <Typography variant="caption" color="text.secondary">
          {statusLabel}
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
        AI-powered PUBG performance analytics.
      </Typography>

      <Stack spacing={1.5}>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter a PUBG player name (steam shard)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <Button variant="contained" onClick={onSearch} disabled={loading} sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          Search
        </Button>
      </Stack>

      {player && <RecentlyAnalyzed player={player} historyRefreshToken={historyRefreshToken} />}
    </Box>
  );
}

export default Sidebar;
