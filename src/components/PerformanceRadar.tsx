import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import type { RadarScores } from "../types/seasonStats";

interface PerformanceRadarProps {
  scores: RadarScores;
}

const AXES: { key: keyof RadarScores; label: string }[] = [
  { key: "combat", label: "Combat" },
  { key: "precision", label: "Precision" },
  { key: "aggression", label: "Aggression" },
  { key: "consistency", label: "Consistency" },
  { key: "support", label: "Support" },
  { key: "survival", label: "Survival" },
];

const WIDTH = 300;
const HEIGHT = 260;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2 + 5;
const MAX_RADIUS = 70;
const LABEL_RADIUS = MAX_RADIUS * 1.35;
const RING_FRACTIONS = [0.33, 0.66, 1];

function pointAt(index: number, radius: number) {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3;
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  };
}

function ringPoints(radius: number) {
  return AXES.map((_, i) => {
    const { x, y } = pointAt(i, radius);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

// Hand-rolled SVG hexagon radar - 6 fixed axes, no charting library needed for one chart.
// Single series: recessive gridlines, one primary-color fill, direct axis labels (no
// legend needed - the chart title already names the series).
function PerformanceRadar({ scores }: PerformanceRadarProps) {
  const theme = useTheme();

  const dataPoints = AXES.map((axis, i) => {
    const value = Math.max(0, Math.min(100, scores[axis.key]));
    const { x, y } = pointAt(i, (value / 100) * MAX_RADIUS);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Performance radar chart">
        {RING_FRACTIONS.map((fraction) => (
          <polygon
            key={fraction}
            points={ringPoints(MAX_RADIUS * fraction)}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={1}
          />
        ))}
        {AXES.map((axis, i) => {
          const { x, y } = pointAt(i, MAX_RADIUS);
          return <line key={axis.key} x1={CENTER_X} y1={CENTER_Y} x2={x} y2={y} stroke={theme.palette.divider} strokeWidth={1} />;
        })}
        <polygon points={dataPoints} fill={theme.palette.primary.main} fillOpacity={0.25} stroke={theme.palette.primary.main} strokeWidth={2} />
        {AXES.map((axis, i) => {
          const { x, y } = pointAt(i, LABEL_RADIUS);
          const anchor = Math.abs(x - CENTER_X) < 4 ? "middle" : x > CENTER_X ? "start" : "end";
          return (
            <text key={axis.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill={theme.palette.text.secondary}>
              {axis.label}
            </text>
          );
        })}
      </svg>
    </Box>
  );
}

export default PerformanceRadar;
