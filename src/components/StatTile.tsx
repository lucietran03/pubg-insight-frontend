import { Box, Typography } from "@mui/material";

interface StatTileProps {
  label: string;
  value: string | number;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: "6px",
        py: 1.5,
        px: 1,
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default StatTile;
