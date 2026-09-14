import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { getPopulationComparison } from "../services/populationService";
import type { PopulationComparison as PopulationComparisonData } from "../types/populationComparison";
import SectionTitle from "./SectionTitle";

interface PopulationComparisonProps {
  playerId: string;
  matchId: string;
}

// Fails silently by design, same convention as WeaponBreakdown: a fetch failure or an
// empty analytics feed just skips rendering this optional panel - no error UI, no retry.
function PopulationComparison({ playerId, matchId }: PopulationComparisonProps) {
  const [data, setData] = useState<PopulationComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPopulationComparison(playerId, matchId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        // Silently ignored - see the component-level comment above.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [playerId, matchId]);

  // Athena queries take a few seconds, so a skeleton (rather than nothing) signals a
  // panel is actually loading here, distinct from WeaponBreakdown's near-instant DynamoDB read.
  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="text" width={180} height={28} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    );
  }

  if (!data || data.sampleSize === 0) {
    return null;
  }

  const rounded = Math.round(data.deltaPct);
  const isAboveMedian = rounded > 0;

  return (
    <Box sx={{ mt: 2 }}>
      <SectionTitle>Population Comparison</SectionTitle>
      <Box sx={{ bgcolor: "background.paper", borderRadius: "6px", p: 1.5 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: isAboveMedian ? "success.main" : "text.primary" }}
        >
          {rounded === 0
            ? "Right at the median damage for this game mode."
            : `${isAboveMedian ? "▲" : "▼"} ${Math.abs(rounded)}% ${isAboveMedian ? "above" : "below"} the median damage for this game mode.`}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Median {data.medianDamage.toFixed(0)} damage across {data.sampleSize} matches analyzed by this app.
        </Typography>
      </Box>
    </Box>
  );
}

export default PopulationComparison;
