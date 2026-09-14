import { Box, Stack, Typography } from "@mui/material";
import type { SeasonStats } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";
import MetricHero from "./MetricHero";
import PerformanceRadar from "./PerformanceRadar";
import StatTile from "./StatTile";

interface PerformanceBreakdownProps {
  stats: SeasonStats;
}

function SubLabel({ children }: { children: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ display: "block", fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", mb: 1 }}
    >
      {children}
    </Typography>
  );
}

// Primary (Avg Damage, K/D) get the large MetricHero treatment; the rest are supporting
// evidence for the radar's axes, not equal-weight headline numbers.
function PerformanceBreakdown({ stats }: PerformanceBreakdownProps) {
  const comparison = stats.previousSeasonComparison;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "45% 1fr" }, gap: 3, alignItems: "center" }}>
      <Stack spacing={2}>
        <Box>
          <SubLabel>Primary Signals</SubLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
            <Box>
              <MetricHero label="Avg Damage" value={stats.avgDamage.toFixed(0)} />
              {comparison && <DeltaIndicator deltaPct={comparison.avgDamageDeltaPct} />}
            </Box>
            <Box>
              <MetricHero label="K/D Ratio" value={stats.killDeathRatio.toFixed(2)} />
              {comparison && <DeltaIndicator deltaPct={comparison.killDeathRatioDeltaPct} />}
            </Box>
          </Box>
        </Box>

        <Box>
          <SubLabel>Supporting Signals</SubLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
            <Box>
              <StatTile label="Headshot Rate" value={`${(stats.headshotRate * 100).toFixed(0)}%`} />
              {comparison && <DeltaIndicator deltaPct={comparison.headshotRateDeltaPct} />}
            </Box>
            <Box>
              <StatTile label="Top 10 Rate" value={`${(stats.top10Rate * 100).toFixed(0)}%`} />
              {comparison && <DeltaIndicator deltaPct={comparison.top10RateDeltaPct} />}
            </Box>
            <Box>
              <StatTile label="Avg Survival" value={`${Math.round(stats.avgSurvivalSeconds / 60)}m`} />
              {comparison && <DeltaIndicator deltaPct={comparison.avgSurvivalDeltaPct} />}
            </Box>
            <Box>
              <StatTile label="Longest Kill" value={`${stats.longestKillMeters.toFixed(0)}m`} />
              {comparison && <DeltaIndicator deltaPct={comparison.longestKillDeltaPct} />}
            </Box>
            {/* Unbounded ratio (a kill without a prior knock still counts), same "x per y"
                shape as K/D Ratio above - a % suffix would falsely imply a 0-100% bounded rate. */}
            <StatTile label="Finish Rate" value={`${stats.knockToKillRate.toFixed(2)}×`} />
          </Box>
        </Box>
      </Stack>

      <Box>
        <SubLabel>Player Profile</SubLabel>
        <PerformanceRadar scores={stats.radar} />
      </Box>
    </Box>
  );
}

export default PerformanceBreakdown;
