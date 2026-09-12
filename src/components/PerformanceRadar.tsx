import { useId } from "react";
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

const WIDTH = 350;
const HEIGHT = 325;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2 + 5;
const MAX_RADIUS = 84;
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
// legend needed - the chart title already names the series). Scales to its container
// (viewBox + max-width) so it can act as a real centerpiece next to the stat grid instead
// of a small fixed-size chart.
function PerformanceRadar({ scores }: PerformanceRadarProps) {
  const theme = useTheme();
  const gradientId = useId();
  const glowId = useId();

  const vertices = AXES.map((axis, i) => {
    const value = Math.max(0, Math.min(100, scores[axis.key]));
    return pointAt(i, (value / 100) * MAX_RADIUS);
  });
  const dataPoints = vertices.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", maxWidth: 380, height: "auto" }}
        role="img"
        aria-label="Performance radar chart"
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.45} />
            <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.12} />
          </radialGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {RING_FRACTIONS.map((fraction) => (
          <polygon
            key={fraction}
            points={ringPoints(MAX_RADIUS * fraction)}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={fraction === 1 ? 1.5 : 1}
            opacity={fraction === 1 ? 0.9 : 0.5}
          />
        ))}
        {AXES.map((axis, i) => {
          const { x, y } = pointAt(i, MAX_RADIUS);
          return (
            <line
              key={axis.key}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={x}
              y2={y}
              stroke={theme.palette.divider}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        <polygon
          points={dataPoints}
          fill={`url(#${gradientId})`}
          stroke={theme.palette.primary.main}
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        {vertices.map((vertex, i) => (
          <circle
            key={AXES[i].key}
            cx={vertex.x}
            cy={vertex.y}
            r={4}
            fill={theme.palette.primary.main}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
          />
        ))}

        {AXES.map((axis, i) => {
          const { x, y } = pointAt(i, LABEL_RADIUS);
          const anchor = Math.abs(x - CENTER_X) < 4 ? "middle" : x > CENTER_X ? "start" : "end";
          const value = Math.round(Math.max(0, Math.min(100, scores[axis.key])));
          return (
            <text key={axis.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill={theme.palette.text.secondary}>
              {axis.label}
              <tspan x={x} dy="1.3em" fontSize={14} fontWeight={800} fill={theme.palette.primary.main}>
                {value}
              </tspan>
            </text>
          );
        })}
      </svg>
    </Box>
  );
}

export default PerformanceRadar;
