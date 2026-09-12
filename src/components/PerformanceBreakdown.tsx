import { Box } from "@mui/material";
import type { SeasonStats } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";
import PerformanceRadar from "./PerformanceRadar";
import StatTile from "./StatTile";

interface PerformanceBreakdownProps {
  stats: SeasonStats;
}

// LEFT (~45%): the 6 stat tiles, 2 columns x 3 rows. RIGHT (~55%): the radar, the visual
// centerpiece of this card. Stacks to a single column on mobile, radar below the stats.
function PerformanceBreakdown({ stats }: PerformanceBreakdownProps) {
  const comparison = stats.previousSeasonComparison;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "45% 1fr" }, gap: 3, alignItems: "center" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
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

      <Box>
        <PerformanceRadar scores={stats.radar} />
      </Box>
    </Box>
  );
}

export default PerformanceBreakdown;
