import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BodyPartDamage } from "../types/weaponKill";

interface BodyPartDiagramProps {
  parts: BodyPartDamage[];
}

const WIDTH = 200;
const HEIGHT = 340;

// A simplified humanoid silhouette (not anatomically precise - this is a data visualization,
// not a game-accurate hitbox overlay). "Arms" and "Legs" are each a single data category
// covering both left+right telemetry hits, so both shapes for a side pair share one color.
const REGIONS: { label: string; shapes: { kind: "circle" | "rect"; props: Record<string, number> }[] }[] = [
  { label: "Head", shapes: [{ kind: "circle", props: { cx: 100, cy: 36, r: 24 } }] },
  { label: "Torso", shapes: [{ kind: "rect", props: { x: 66, y: 64, width: 68, height: 100, rx: 16 } }] },
  {
    label: "Arms",
    shapes: [
      { kind: "rect", props: { x: 32, y: 70, width: 26, height: 92, rx: 13 } },
      { kind: "rect", props: { x: 142, y: 70, width: 26, height: 92, rx: 13 } },
    ],
  },
  { label: "Pelvis", shapes: [{ kind: "rect", props: { x: 72, y: 164, width: 56, height: 36, rx: 10 } }] },
  {
    label: "Legs",
    shapes: [
      { kind: "rect", props: { x: 74, y: 200, width: 24, height: 120, rx: 12 } },
      { kind: "rect", props: { x: 102, y: 200, width: 24, height: 120, rx: 12 } },
    ],
  },
];

// Hand-rolled SVG, no charting/body-tracking library - same "simple shapes over a library"
// convention as PerformanceRadar.tsx. Fill intensity (a single hue, light-to-dark) encodes
// hit share, per this app's established sequential-magnitude color rule; a region with zero
// hits stays a flat, recessive outline instead of a colored fill.
function BodyPartDiagram({ parts }: BodyPartDiagramProps) {
  const theme = useTheme();

  const hitsByLabel = new Map(parts.map((part) => [part.label, part.hits]));
  const totalHits = parts.reduce((sum, part) => sum + part.hits, 0);
  const maxHits = Math.max(1, ...parts.map((part) => part.hits));

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center" }}>
      <Box sx={{ flexShrink: 0 }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: 120, height: "auto" }} role="img" aria-label="Body-part hit diagram">
          {REGIONS.map((region) => {
            const hits = hitsByLabel.get(region.label) ?? 0;
            const intensity = hits / maxHits;
            const fill = hits > 0 ? alpha(theme.palette.primary.main, 0.2 + 0.7 * intensity) : "none";
            const stroke = hits > 0 ? theme.palette.primary.main : theme.palette.divider;

            return region.shapes.map((shape, i) =>
              shape.kind === "circle" ? (
                <circle
                  key={`${region.label}-${i}`}
                  cx={shape.props.cx}
                  cy={shape.props.cy}
                  r={shape.props.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                />
              ) : (
                <rect
                  key={`${region.label}-${i}`}
                  x={shape.props.x}
                  y={shape.props.y}
                  width={shape.props.width}
                  height={shape.props.height}
                  rx={shape.props.rx}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1.5}
                />
              )
            );
          })}
        </svg>
      </Box>

      <Stack spacing={0.75} sx={{ width: "100%" }}>
        {parts.map((part) => (
          <Stack key={part.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                flexShrink: 0,
                bgcolor:
                  part.hits > 0
                    ? alpha(theme.palette.primary.main, 0.2 + 0.7 * (part.hits / maxHits))
                    : "transparent",
                border: "1px solid",
                borderColor: part.hits > 0 ? "primary.main" : "divider",
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 56 }}>
              {part.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {part.hits} {part.hits === 1 ? "hit" : "hits"}
              {totalHits > 0 ? ` · ${Math.round((part.hits / totalHits) * 100)}%` : ""}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export default BodyPartDiagram;
