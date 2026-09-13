import { useEffect, useState } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getWeaponBreakdown } from "../services/weaponService";
import type { MatchCombatBreakdown, WeaponKill } from "../types/weaponKill";
import BodyPartDiagram from "./BodyPartDiagram";
import SectionTitle from "./SectionTitle";

interface WeaponBreakdownProps {
  playerId: string;
  matchId: string;
}

function SubLabel({ children }: { children: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 1 }}>
      <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "primary.main" }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, letterSpacing: 0.8, color: "text.secondary", textTransform: "uppercase" }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

const RING_SIZE = 76;
const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Ring gauge via SVG stroke-dasharray, same hand-rolled convention as PerformanceRadar.
// Top weapon gets a gold border so the eye lands there first.
function WeaponGaugeCard({ weapon, share, isTop }: { weapon: WeaponKill; share: number; isTop: boolean }) {
  const theme = useTheme();
  const arcLength = share * RING_CIRCUMFERENCE;

  return (
    <Box
      sx={{
        flex: "1 1 96px",
        minWidth: 96,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1.25,
        borderRadius: "10px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: isTop ? "primary.main" : "transparent",
      }}
    >
      <svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 100 100" role="img" aria-label={`${weapon.weapon} kill share`}>
        <circle cx={50} cy={50} r={RING_RADIUS} fill="none" stroke={theme.palette.divider} strokeWidth={9} />
        <circle
          cx={50}
          cy={50}
          r={RING_RADIUS}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${RING_CIRCUMFERENCE}`}
          transform="rotate(-90 50 50)"
        />
        <text x={50} y={47} textAnchor="middle" fontSize={24} fontWeight={800} fill={theme.palette.text.primary}>
          {weapon.kills}
        </text>
        <text x={50} y={64} textAnchor="middle" fontSize={11} fill={theme.palette.text.secondary}>
          {Math.round(share * 100)}%
        </text>
      </svg>
      <Typography
        variant="body2"
        sx={{ fontWeight: isTop ? 800 : 700, mt: 0.5, textAlign: "center", lineHeight: 1.2 }}
      >
        {weapon.weapon}
      </Typography>
    </Box>
  );
}

// Fails silently by design: a missing breakdown (expired telemetry, a 0-kill match, a
// transient fetch failure) just means this optional panel doesn't render - no error UI,
// no retry button.
function WeaponBreakdown({ playerId, matchId }: WeaponBreakdownProps) {
  const [breakdown, setBreakdown] = useState<MatchCombatBreakdown | null>(null);

  useEffect(() => {
    // No need to reset `breakdown` on matchId change: MatchList mounts this with
    // key={selectedMatchId}, so a new match is always a fresh mount.
    let cancelled = false;

    getWeaponBreakdown(playerId, matchId)
      .then((result) => {
        if (!cancelled) setBreakdown(result);
      })
      .catch(() => {
        // Silently ignored - see the component-level comment above.
      });

    return () => {
      cancelled = true;
    };
  }, [playerId, matchId]);

  const weapons = breakdown?.weapons ?? [];
  // Only show buckets with at least one kill; an all-zero row would be noise.
  const shotDistances = (breakdown?.shotDistances ?? []).filter((bucket) => bucket.kills > 0);
  // Backend always returns all five body-part labels (even at 0); filtering zero rows here
  // is just a display choice.
  const bodyPartDamage = (breakdown?.bodyPartDamage ?? []).filter((part) => part.hits > 0);

  if (weapons.length === 0 && shotDistances.length === 0 && bodyPartDamage.length === 0) {
    return null;
  }

  const totalWeaponKills = weapons.reduce((sum, w) => sum + w.kills, 0);
  const maxDistanceKills = shotDistances.length > 0 ? Math.max(...shotDistances.map((b) => b.kills)) : 1;

  return (
    <Box sx={{ mt: 2 }}>
      <SectionTitle>Weapons Used</SectionTitle>
      <Box sx={{ bgcolor: "background.paper", borderRadius: "6px", p: 1.5 }}>
        {weapons.length > 0 && (
          <Box>
            <SubLabel>By Weapon</SubLabel>
            <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
              {weapons.map((weapon, index) => (
                <WeaponGaugeCard
                  key={weapon.weapon}
                  weapon={weapon}
                  share={totalWeaponKills > 0 ? weapon.kills / totalWeaponKills : 0}
                  isTop={index === 0}
                />
              ))}
            </Stack>
          </Box>
        )}

        {weapons.length > 0 && shotDistances.length > 0 && <Divider sx={{ my: 1.5 }} />}

        {shotDistances.length > 0 && (
          <Box>
            <SubLabel>By Shot Distance</SubLabel>
            <Stack spacing={1}>
              {shotDistances.map((bucket) => (
                <Stack key={bucket.label} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 96 }}>
                    {bucket.label}
                  </Typography>
                  <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: "background.default" }}>
                    <Box
                      sx={{
                        height: "100%",
                        borderRadius: 4,
                        bgcolor: "secondary.main",
                        width: `${(bucket.kills / maxDistanceKills) * 100}%`,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: "right" }}>
                    {bucket.kills} {bucket.kills === 1 ? "kill" : "kills"}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {(weapons.length > 0 || shotDistances.length > 0) && bodyPartDamage.length > 0 && (
          <Divider sx={{ my: 1.5 }} />
        )}

        {bodyPartDamage.length > 0 && (
          <Box>
            <SubLabel>By Body Part</SubLabel>
            <BodyPartDiagram parts={bodyPartDamage} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default WeaponBreakdown;
