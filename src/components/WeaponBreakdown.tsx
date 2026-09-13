import { useEffect, useState } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { getWeaponBreakdown } from "../services/weaponService";
import type { MatchCombatBreakdown } from "../types/weaponKill";
import SectionTitle from "./SectionTitle";

interface WeaponBreakdownProps {
  playerId: string;
  matchId: string;
}

// New, telemetry-derived section for the already-existing Selected Match panel
// (see MatchList.tsx) - a per-weapon kill breakdown, a shot-distance histogram, and a
// hits-by-body-part breakdown, none of which the PUBG summary/season-stats APIs this app
// otherwise relies on can produce (they don't expose which weapon got each kill, at what
// range, or where each hit landed). Backed by a brand new endpoint
// (GET /api/players/{playerId}/matches/{matchId}/weapons) that parses this one match's raw
// telemetry file server-side.
//
// Deliberately fails silently: this endpoint can legitimately return nothing (a match whose
// telemetry has expired on PUBG's side, a 0-kill match, a transient fetch/parse failure on a
// large file) and none of those are "the match page is broken" - they just mean this optional
// panel doesn't render, exactly per this feature's isolation requirement. There is no retry
// button and no error message shown here on purpose.
function WeaponBreakdown({ playerId, matchId }: WeaponBreakdownProps) {
  const [breakdown, setBreakdown] = useState<MatchCombatBreakdown | null>(null);

  useEffect(() => {
    // No need to reset `breakdown` to null here on matchId change: MatchList.tsx mounts this
    // component with `key={selectedMatchId}`, so a different match is always a fresh mount
    // (fresh `useState(null)`), never a state carryover from the previous match.
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
  // Only show distance buckets that actually have a kill in them - an empty "120-300m: 0"
  // row for every match would be noise, not signal.
  const shotDistances = (breakdown?.shotDistances ?? []).filter((bucket) => bucket.kills > 0);
  // Same convention: only show body parts that were actually hit at least once. The backend
  // always returns all five labels (even at 0) so it can add new ones later without a
  // frontend change; filtering zero rows here is purely a display choice.
  const bodyPartDamage = (breakdown?.bodyPartDamage ?? []).filter((part) => part.hits > 0);

  if (weapons.length === 0 && shotDistances.length === 0 && bodyPartDamage.length === 0) {
    return null;
  }

  const maxWeaponKills = weapons.length > 0 ? Math.max(...weapons.map((w) => w.kills)) : 1;
  const maxDistanceKills = shotDistances.length > 0 ? Math.max(...shotDistances.map((b) => b.kills)) : 1;
  const totalBodyPartHits = bodyPartDamage.reduce((sum, part) => sum + part.hits, 0);
  const maxBodyPartHits = bodyPartDamage.length > 0 ? Math.max(...bodyPartDamage.map((p) => p.hits)) : 1;

  return (
    <Box sx={{ mt: 2 }}>
      <SectionTitle>Weapons Used</SectionTitle>
      <Box sx={{ bgcolor: "background.paper", borderRadius: "6px", p: 1.5 }}>
        {weapons.length > 0 && (
          <Stack spacing={1}>
            {weapons.map((weapon) => (
              <Stack key={weapon.weapon} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 96 }}>
                  {weapon.weapon}
                </Typography>
                <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: "background.default" }}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      bgcolor: "primary.main",
                      width: `${(weapon.kills / maxWeaponKills) * 100}%`,
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: "right" }}>
                  {weapon.kills} {weapon.kills === 1 ? "kill" : "kills"}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {weapons.length > 0 && shotDistances.length > 0 && <Divider sx={{ my: 1.5 }} />}

        {shotDistances.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Kills by shot distance
            </Typography>
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
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Hits by body part
            </Typography>
            <Stack spacing={1}>
              {bodyPartDamage.map((part) => (
                <Stack key={part.label} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 96 }}>
                    {part.label}
                  </Typography>
                  <Box sx={{ flexGrow: 1, height: 8, borderRadius: 4, bgcolor: "background.default" }}>
                    <Box
                      sx={{
                        height: "100%",
                        borderRadius: 4,
                        bgcolor: "info.main",
                        width: `${(part.hits / maxBodyPartHits) * 100}%`,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 88, textAlign: "right" }}>
                    {part.hits} {part.hits === 1 ? "hit" : "hits"}
                    {totalBodyPartHits > 0 ? ` (${Math.round((part.hits / totalBodyPartHits) * 100)}%)` : ""}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default WeaponBreakdown;
