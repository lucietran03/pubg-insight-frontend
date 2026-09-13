import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getWeaponBreakdown } from "../services/weaponService";
import type { WeaponKill } from "../types/weaponKill";
import SectionTitle from "./SectionTitle";

interface WeaponBreakdownProps {
  playerId: string;
  matchId: string;
}

// New, telemetry-derived section for the already-existing Selected Match panel
// (see MatchList.tsx) - a per-weapon kill breakdown that the PUBG summary/season-stats
// APIs this app otherwise relies on simply cannot produce (they don't expose which weapon
// got each kill, only kill counts). Backed by a brand new endpoint
// (GET /api/players/{playerId}/matches/{matchId}/weapons) that parses this one match's raw
// telemetry file server-side.
//
// Deliberately fails silently: this endpoint can legitimately return nothing (a match whose
// telemetry has expired on PUBG's side, a 0-kill match, a transient fetch/parse failure on a
// large file) and none of those are "the match page is broken" - they just mean this optional
// panel doesn't render, exactly per this feature's isolation requirement. There is no retry
// button and no error message shown here on purpose.
function WeaponBreakdown({ playerId, matchId }: WeaponBreakdownProps) {
  const [weapons, setWeapons] = useState<WeaponKill[] | null>(null);

  useEffect(() => {
    // No need to reset `weapons` to null here on matchId change: MatchList.tsx mounts this
    // component with `key={selectedMatchId}`, so a different match is always a fresh mount
    // (fresh `useState(null)`), never a state carryover from the previous match.
    let cancelled = false;

    getWeaponBreakdown(playerId, matchId)
      .then((result) => {
        if (!cancelled) setWeapons(result);
      })
      .catch(() => {
        // Silently ignored - see the component-level comment above.
      });

    return () => {
      cancelled = true;
    };
  }, [playerId, matchId]);

  if (!weapons || weapons.length === 0) {
    return null;
  }

  const maxKills = Math.max(...weapons.map((w) => w.kills));

  return (
    <Box sx={{ mt: 2 }}>
      <SectionTitle>Weapons Used</SectionTitle>
      <Stack spacing={1} sx={{ bgcolor: "background.paper", borderRadius: "6px", p: 1.5 }}>
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
                  width: `${(weapon.kills / maxKills) * 100}%`,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: "right" }}>
              {weapon.kills} {weapon.kills === 1 ? "kill" : "kills"}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default WeaponBreakdown;
