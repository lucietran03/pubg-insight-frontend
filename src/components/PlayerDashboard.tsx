import { useEffect, useState } from "react";
import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { getSeasonStats } from "../services/seasonStatsService";
import type { Player } from "../types/player";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";
import MatchList from "./MatchList";
import PerformanceBreakdown from "./PerformanceBreakdown";
import PlayerIdentityCard from "./PlayerIdentityCard";
import RecentFormChip from "./RecentFormChip";
import RevealOnMount from "./RevealOnMount";
import SeasonStats from "./SeasonStats";
import SectionTitle from "./SectionTitle";

interface PlayerDashboardProps {
  player: Player;
  onAnalysisRecorded?: () => void;
}

function PlayerDashboard({ player, onAnalysisRecorded }: PlayerDashboardProps) {
  // Fetched here (not inside SeasonStats) so both the compact and full-width cards below
  // can share it without a duplicate call.
  const [seasonStats, setSeasonStats] = useState<SeasonStatsData | null>(null);
  const [seasonStatsLoading, setSeasonStatsLoading] = useState(true);
  const [seasonStatsError, setSeasonStatsError] = useState<string | null>(null);
  const [seasonStatsRetryToken, setSeasonStatsRetryToken] = useState(0);

  useEffect(() => {
    getSeasonStats(player.id)
      .then((result) => setSeasonStats(result))
      .catch((err) => setSeasonStatsError(getErrorMessage(err, "No season stats found for this player.")))
      .finally(() => setSeasonStatsLoading(false));
  }, [player.id, seasonStatsRetryToken]);

  const handleSeasonStatsRetry = () => {
    setSeasonStatsLoading(true);
    setSeasonStatsError(null);
    setSeasonStatsRetryToken((token) => token + 1);
  };

  return (
    <Box>
      <RevealOnMount delayMs={0}>
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  color: "background.default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  flexShrink: 0,
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, wordBreak: "break-word", lineHeight: 1.15 }}>
                  {player.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.4 }}>
                  {player.shardId.toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4 }}>
                  {player.recentMatchIds.length} matches · last 14 days
                </Typography>
              </Box>
            </Stack>

            {seasonStats && (
              <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1.5 }}>
                <PlayerIdentityCard archetype={seasonStats.archetype} radar={seasonStats.radar} />
                {seasonStats.previousSeasonComparison && (
                  <RecentFormChip winRateDeltaPct={seasonStats.previousSeasonComparison.winRateDeltaPct} />
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </RevealOnMount>

      <RevealOnMount delayMs={120}>
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <SectionTitle>Season Performance</SectionTitle>
            <SeasonStats
              stats={seasonStats}
              loading={seasonStatsLoading}
              error={seasonStatsError}
              onRetry={handleSeasonStatsRetry}
            />
            {seasonStats && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <PerformanceBreakdown stats={seasonStats} />
              </>
            )}
          </CardContent>
        </Card>
      </RevealOnMount>

      <RevealOnMount delayMs={seasonStats ? 240 : 120}>
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <SectionTitle>Recent Matches</SectionTitle>
            <MatchList playerId={player.id} matchIds={player.recentMatchIds} onAnalysisRecorded={onAnalysisRecorded} />
          </CardContent>
        </Card>
      </RevealOnMount>
    </Box>
  );
}

export default PlayerDashboard;
