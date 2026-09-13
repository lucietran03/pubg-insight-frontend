export interface WeaponKill {
  weapon: string;
  kills: number;
}

export interface DistanceBucket {
  label: string;
  kills: number;
}

// Excludes non-directional damage (bluezone, falls, etc.), which has no body part.
export interface BodyPartDamage {
  label: string;
  hits: number;
}

export interface MatchCombatBreakdown {
  weapons: WeaponKill[];
  shotDistances: DistanceBucket[];
  bodyPartDamage: BodyPartDamage[];
}
