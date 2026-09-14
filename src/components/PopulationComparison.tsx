import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { getPopulationComparison } from "../services/populationService";
import type { PopulationComparison as PopulationComparisonData } from "../types/populationComparison";

interface PopulationComparisonProps {
  playerId: string;
  matchId: string;
}

// Matches MatchList's season-average delta tiles so this reads as one more tile in the
// same comparisons grid, not a separate section.
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Fails silently by design, same convention as WeaponBreakdown: a fetch failure or an
// empty analytics feed just skips rendering this tile - no error UI, no retry.
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

  // Athena queries take a few seconds, so a skeleton tile (rather than nothing) signals
  // this slot is still loading, distinct from the season-average tiles that render instantly.
  if (loading) {
    return (
      <Box sx={{ bgcolor: "background.paper", borderRadius: "6px", py: 1.5, px: 1, textAlign: "center" }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mx: "auto" }} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mx: "auto" }} />
      </Box>
    );
  }

  if (!data || data.sampleSize === 0) {
    return null;
  }

  const rounded = Math.round(data.deltaPct);
  const isBetter = rounded >= 0;

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "6px", py: 1.5, px: 1, textAlign: "center" }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, lineHeight: 1, color: isBetter ? "success.main" : "error.main", animation: `${slideIn} 0.4s ease-out` }}
      >
        {isBetter ? "▲" : "▼"} {Math.abs(rounded)}%
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
        Damage
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        vs all players ({data.sampleSize})
      </Typography>
    </Box>
  );
}

export default PopulationComparison;
