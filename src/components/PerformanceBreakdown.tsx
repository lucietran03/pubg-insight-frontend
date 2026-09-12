import { Box, Divider, Typography } from "@mui/material";
import type { SeasonStats } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";
import PerformanceRadar from "./PerformanceRadar";
import StatTile from "./StatTile";

interface PerformanceBreakdownProps {
  stats: SeasonStats;
}

// Full-width card: the detailed stat grid + performance radar, split out of the compact
// "Season Performance" card so that one stays balanced in height with "Player Overview".
function PerformanceBreakdown({ stats }: PerformanceBreakdownProps) {
  const comparison = stats.previousSeasonComparison;

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
          gap: 1.5,
        }}
      >
        <Box>
          <StatTile label="Avg Damage" value={stats.avgDamage.toFixed(0)} />
          {comparison && <DeltaIndicator deltaPct={comparison.avgDamageDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="K/D Ratio" value={stats.killDeathRatio.toFixed(2)} />
          {comparison && <DeltaIndicator deltaPct={comparison.killDeathRatioDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="Headshot Rate" value={`${(stats.headshotRate * 100).toFixed(0)}%`} />
          {comparison && <DeltaIndicator deltaPct={comparison.headshotRateDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="Top 10 Rate" value={`${(stats.top10Rate * 100).toFixed(0)}%`} />
          {comparison && <DeltaIndicator deltaPct={comparison.top10RateDeltaPct} />}
        </Box>
        <StatTile label="Avg Survival" value={`${Math.round(stats.avgSurvivalSeconds / 60)}m`} />
        <StatTile label="Longest Kill" value={`${stats.longestKillMeters.toFixed(0)}m`} />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
        Performance Radar
      </Typography>
      <PerformanceRadar scores={stats.radar} />
    </Box>
  );
}

export default PerformanceBreakdown;
