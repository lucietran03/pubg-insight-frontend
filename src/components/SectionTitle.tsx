import { Box, Typography } from "@mui/material";

interface SectionTitleProps {
  children: string;
}

// Shared section header used everywhere a card needs a title (Player Overview, Season
// Performance, Performance Breakdown, Performance Radar, Recent Matches) - a small gold
// accent bar + bold uppercase text reads as a clear section start without being loud.
// Single source of truth so every section title stays visually identical.
function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Box sx={{ width: 3, height: 16, borderRadius: "2px", bgcolor: "primary.main", flexShrink: 0 }} />
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "text.primary" }}
      >
        {children}
      </Typography>
    </Box>
  );
}

export default SectionTitle;
