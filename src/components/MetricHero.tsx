import { Box, Typography } from "@mui/material";

interface MetricHeroProps {
  label: string;
  value: string | number;
}

// Headline treatment for the 2-3 primary signals in Performance Breakdown - no container,
// just scale + a short accent rule, so it reads as a headline rather than a bigger stat tile.
function MetricHero({ label, value }: MetricHeroProps) {
  return (
    <Box>
      <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: "block", mt: 0.75, fontWeight: 800, letterSpacing: 1, color: "text.secondary" }}
      >
        {label.toUpperCase()}
      </Typography>
      <Box sx={{ width: 32, height: 2, bgcolor: "primary.main", mt: 1, borderRadius: 1 }} />
    </Box>
  );
}

export default MetricHero;
