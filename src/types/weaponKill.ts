export interface WeaponKill {
  weapon: string;
  kills: number;
}

export interface DistanceBucket {
  label: string;
  kills: number;
}

export interface MatchCombatBreakdown {
  weapons: WeaponKill[];
  shotDistances: DistanceBucket[];
}
