import { Box, Stack, Typography } from "@mui/material";
import type { SeasonStats } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";
import MetricHero from "./MetricHero";
import PerformanceRadar from "./PerformanceRadar";

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

interface RailMetric {
  label: string;
  value: string;
  deltaPct?: number;
}

// Compact metric matrix: a 2-column grid instead of five identical stat cards - each entry
// is just a value/label pair, not its own bordered box. 2 columns keeps each cell wide
// enough to read comfortably in the narrower left column next to the radar.
function MetricRail({ metrics }: { metrics: RailMetric[] }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 2, rowGap: 1.5 }}>
      {metrics.map((metric) => (
        <Box key={metric.label}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {metric.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {metric.label}
          </Typography>
          {metric.deltaPct !== undefined && <DeltaIndicator deltaPct={metric.deltaPct} />}
        </Box>
      ))}
    </Box>
  );
}

// Primary (Avg Damage, K/D) get the large MetricHero headline treatment; the rest are
// supporting evidence for the radar's axes, shown as one compact rail rather than five cards.
function PerformanceBreakdown({ stats }: PerformanceBreakdownProps) {
  const comparison = stats.previousSeasonComparison;

  const supportingMetrics: RailMetric[] = [
    { label: "Headshot Rate", value: `${(stats.headshotRate * 100).toFixed(0)}%`, deltaPct: comparison?.headshotRateDeltaPct },
    { label: "Top 10 Rate", value: `${(stats.top10Rate * 100).toFixed(0)}%`, deltaPct: comparison?.top10RateDeltaPct },
    { label: "Avg Survival", value: `${Math.round(stats.avgSurvivalSeconds / 60)}m`, deltaPct: comparison?.avgSurvivalDeltaPct },
    { label: "Longest Kill", value: `${stats.longestKillMeters.toFixed(0)}m`, deltaPct: comparison?.longestKillDeltaPct },
    // Unbounded ratio (a kill without a prior knock still counts), same "x per y" shape as
    // K/D Ratio - a % suffix would falsely imply a 0-100% bounded rate.
    { label: "Finish Rate", value: `${stats.knockToKillRate.toFixed(2)}×` },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "45% 1fr" }, gap: 3, alignItems: "center" }}>
      <Stack spacing={3}>
        <Box>
          <SubLabel>Primary Signals</SubLabel>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>
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
          <MetricRail metrics={supportingMetrics} />
        </Box>
      </Stack>

      <Stack spacing={3}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1 }}>
          <SubLabel>Player Profile</SubLabel>
          <Box
            sx={{
              width: 5,
              height: 5,
              borderRadius: "1px",
              bgcolor: "primary.main",
              transform: "rotate(45deg)",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, letterSpacing: 0.6, color: "primary.main", fontStyle: "italic" }}
          >
            Performance DNA
          </Typography>
        </Stack>
        <PerformanceRadar scores={stats.radar} />
      </Stack>
    </Box>
  );
}

export default PerformanceBreakdown;
