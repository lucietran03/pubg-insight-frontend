import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { getInsights } from "../services/insightService";
import type { Insight } from "../types/insight";
import { getErrorMessage } from "../utils/errorMessage";

interface AiInsightsProps {
  playerId: string;
  matchId: string;
}

interface InsightChipRowProps {
  label: string;
  items: string[];
  color: "success" | "warning" | "info";
}

function InsightChipRow({ label, items, color }: InsightChipRowProps) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 0.5 }}>
        {items.map((item) => (
          <Chip key={item} label={item} size="small" color={color} variant="outlined" />
        ))}
      </Stack>
    </Box>
  );
}

function AiInsights({ playerId, matchId }: AiInsightsProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setInsight(null);

    try {
      const result = await getInsights(playerId, matchId);
      setInsight(result);
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate insights for this match."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {!insight && (
        <Button variant="outlined" size="small" onClick={handleGenerate} disabled={loading} fullWidth>
          {loading ? "Generating..." : "Generate AI Insights"}
        </Button>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {insight && (
        <Box sx={{ mt: 1, bgcolor: "background.paper", borderRadius: "6px", p: 2 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
            AI PERFORMANCE SUMMARY
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {insight.summary}
          </Typography>

          {(insight.strengths.length > 0 ||
            insight.weaknesses.length > 0 ||
            insight.recommendations.length > 0) && <Divider sx={{ my: 1.5 }} />}

          <InsightChipRow label="STRENGTHS" items={insight.strengths} color="success" />
          <InsightChipRow label="WEAKNESSES" items={insight.weaknesses} color="warning" />
          <InsightChipRow label="RECOMMENDATIONS" items={insight.recommendations} color="info" />
        </Box>
      )}
    </Box>
  );
}

export default AiInsights;
