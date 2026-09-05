export type TroopEvent = 'koi_svs' | 'officer';

export interface ItemData {
  points: number;
  minAmount?: number;
}

export interface SpecialCalc {
  label: string;
  points: number;
  stamina: number;
}

export interface DayData {
  label: string;
  items: Record<string, ItemData>;
  troops?: Partial<Record<TroopEvent, Record<number, number>>>;
  special?: Record<string, SpecialCalc>;
  /** Only set on SvS days — Valeria's "Well Prepared" skill boosts every point earned that day. */
  valeriaEligible?: boolean;
  /** Free-text note shown above the day's items (e.g. reminder to check the calendar). */
  note?: string;
}

export interface EventData {
  title: string;
  days: DayData[];
}

export interface Events {
  [key: string]: EventData;
}

export interface ItemCounts {
  [key: string]: number;
}

export interface CustomEvents {
  [key: string]: EventData;
}

export interface PointsHistoryEntry {
  event: string;
  points: number;
  date: string;
}

export interface Snapshot {
  id: string;
  label: string;
  createdAt: number;
  eventKey: string;
  dayIndex: number;
  itemCounts: ItemCounts;
  totalPoints: number;
}

export interface AccessibilitySettings {
  largeText: boolean;
  extraLargeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface TroopTimeOption {
  value: string;
  label: string;
  seconds: number;
}

export type EventKey = 'koi' | 'svs' | 'officer-essence' | 'officer-charm' | 'armament-tomes' | 'armament-design' | 'custom';

export interface SnipeComboRow {
  item: string;
  quantity: number;
  points: number;
}

export interface SnipeResult {
  combo: SnipeComboRow[];
  totalPoints: number;
  overshoot: number;
  exact: boolean;
  fellBackToGreedy: boolean;
}

export type Tier = 'free' | 'supporter' | 'officer';

export const TIER_RANK: Record<Tier, number> = { free: 0, supporter: 1, officer: 2 };

export function tierAtLeast(have: Tier, need: Tier): boolean {
  return TIER_RANK[have] >= TIER_RANK[need];
}

/** Cloud-synced profile document stored at /users/{uid} in Firestore */
export interface UserProfile {
  tier: Tier;
  tierGrantedByCode?: string;
  displayName: string | null;
  customEvents: CustomEvents;
  snapshots: Snapshot[];
  pointsHistory: PointsHistoryEntry[];
  updatedAt: number;
}
