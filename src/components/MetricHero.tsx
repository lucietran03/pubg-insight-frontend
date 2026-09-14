import { Box, Typography } from "@mui/material";

interface MetricHeroProps {
  label: string;
  value: string | number;
}

// Larger sibling of StatTile for the 2-3 primary signals in Performance Breakdown - same
// data contract, bigger scale so it visually leads the smaller supporting-signal row.
function MetricHero({ label, value }: MetricHeroProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: "8px",
        py: 2.5,
        px: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  );
}

export default MetricHero;
