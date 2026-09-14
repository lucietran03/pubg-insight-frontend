import { Box, Divider, Stack, Typography } from "@mui/material";
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

// Compact metric rail: one shared surface instead of five identical stat cards - each entry
// is just a value/label pair separated by a divider, not its own bordered box.
function MetricRail({ metrics }: { metrics: RailMetric[] }) {
  return (
    <Stack direction="row" spacing={0} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
      {metrics.map((metric, index) => (
        <Stack
          key={metric.label}
          direction="row"
          spacing={{ xs: 0, sm: 2 }}
          sx={{ alignItems: "center" }}
        >
          {index > 0 && (
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" }, mr: 2 }} />
          )}
          <Box sx={{ minWidth: 84, px: { xs: 1.5, sm: 0 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {metric.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {metric.label}
            </Typography>
            {metric.deltaPct !== undefined && <DeltaIndicator deltaPct={metric.deltaPct} />}
          </Box>
        </Stack>
      ))}
    </Stack>
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

      <Box>
        <SubLabel>Player Profile</SubLabel>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -1, mb: 1 }}>
          Performance DNA
        </Typography>
        <PerformanceRadar scores={stats.radar} />
      </Box>
    </Box>
  );
}

export default PerformanceBreakdown;
