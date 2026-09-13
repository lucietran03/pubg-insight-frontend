export interface WeaponKill {
  weapon: string;
  kills: number;
}

export interface DistanceBucket {
  label: string;
  kills: number;
}

// Telemetry-derived "which body part did this player's landed hits strike" breakdown, e.g.
// { label: "Head", hits: 7 }. Sourced from LogPlayerTakeDamage's "damageReason" field - see
// BodyPartDamageDto/WeaponBreakdownService on the backend for how this is derived and why
// non-directional damage (bluezone, falls, etc.) is excluded rather than guessed.
export interface BodyPartDamage {
  label: string;
  hits: number;
}

export interface MatchCombatBreakdown {
  weapons: WeaponKill[];
  shotDistances: DistanceBucket[];
  bodyPartDamage: BodyPartDamage[];
}
