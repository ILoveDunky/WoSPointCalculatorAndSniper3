import type { Events, TroopTimeOption } from './types';

const koiSvsTroops = { 1: 3, 2: 4, 3: 5, 4: 8, 5: 12, 6: 18, 7: 25, 8: 35, 9: 45, 10: 60, 11: 75 };
const combatTrainingTroops = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 11, 7: 16, 8: 23, 9: 30, 10: 39, 11: 49 };
const officerTroops = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 9, 7: 12, 8: 17, 9: 22, 10: 30, 11: 37 };

export const eventData: Events = {
  koi: {
    title: 'King of Icefield',
    days: [
      {
        label: 'Day 1 \u2014 City construction',
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards': { points: 1000 },
          'Refined Fire Crystals': { points: 30000 },
          '1 minute of speedups': { points: 30 },
        },
      },
      {
        label: 'Day 2 \u2014 Hero development',
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards': { points: 1000 },
          'Refined Fire Crystals': { points: 30000 },
          '1 minute of speedups': { points: 30 },
          'Mythic Hero Shard (ascend)': { points: 3040 },
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 40000 },
        },
      },
      {
        label: 'Day 3 \u2014 Basic skill up',
        items: {
          'Advanced Wild Mark': { points: 15000 },
          'Common Wild Mark': { points: 1150 },
          'Mythic Hero Shard': { points: 3040 },
        },
      },
      {
        label: 'Day 4 \u2014 Combat training',
        items: {
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 40000 },
        },
        troops: { koi_svs: combatTrainingTroops },
      },
      {
        label: 'Day 5 \u2014 Basic skills up',
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards': { points: 1000 },
          'Refined Fire Crystals': { points: 30000 },
          '1 minute of speedups': { points: 30 },
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 40000 },
        },
      },
      {
        label: 'Day 6 \u2014 Combat training',
        items: {
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 40000 },
        },
        troops: { koi_svs: combatTrainingTroops },
        note: 'Same items and troop points as Day 4.',
      },
      {
        label: 'Day 7 \u2014 Hero development',
        items: {
          'Advanced Wild Mark': { points: 15000 },
          'Common Wild Mark': { points: 1150 },
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards': { points: 1000 },
          'Refined Fire Crystals': { points: 30000 },
          '1 minute of speedups': { points: 30 },
          'Mythic Hero Shard': { points: 3040 },
        },
      },
    ],
  },

  svs: {
    title: 'State vs State',
    days: [
      {
        label: 'Day 1',
        valeriaEligible: true,
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards (Research)': { points: 1000 },
          'Refined Fire Crystals (FC6+)': { points: 30000 },
          '1 minute of speedups': { points: 30 },
        },
      },
      {
        label: 'Day 2',
        valeriaEligible: true,
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards (Research)': { points: 1000 },
          'Refined Fire Crystals (FC6+)': { points: 30000 },
          'Mythic Hero Shard': { points: 3040 },
          '1 minute of speedups': { points: 30 },
        },
      },
      {
        label: 'Day 3 \u2014 Beast hunting',
        valeriaEligible: true,
        note: 'Only Level 26\u201330 beasts are worth the stamina. Use the stamina planner below to see how far your stamina goes.',
        items: {
          'Mythic Hero Shard': { points: 3040 },
          'Common Wild Mark': { points: 1150 },
          'Advanced Wild Mark': { points: 15000 },
        },
        special: {
          beast: { label: 'Level 26\u201330 beast', points: 12000, stamina: 10 },
          polarTerror: { label: 'Polar Terror', points: 30000, stamina: 25 },
        },
      },
      {
        label: 'Day 4 \u2014 Combat training',
        valeriaEligible: true,
        items: {
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 144000 },
        },
        troops: { koi_svs: koiSvsTroops },
      },
      {
        label: 'Day 5',
        valeriaEligible: true,
        items: {
          'Fire Crystals': { points: 2000 },
          'Fire Crystal Shards (Research)': { points: 1000 },
          'Refined Fire Crystals (FC6+)': { points: 30000 },
          'Hero Gear Essence Stone': { points: 4000 },
          Mithril: { points: 144000 },
          '1 minute of speedups': { points: 30 },
        },
      },
    ],
  },

  'officer-essence': {
    title: 'Officer Project \u2014 Essence',
    days: [
      {
        label: 'Essence Stones reward',
        note: 'Check the in-game event calendar to confirm Essence Stones is the live reward before you plan around this one.',
        items: {
          'Hero Gear Essence Stone': { points: 6000 },
          Mithril: { points: 216000 },
        },
        troops: { officer: officerTroops },
      },
    ],
  },

  'officer-charm': {
    title: 'Officer Project \u2014 Charm Design',
    days: [
      {
        label: 'Charm Design reward',
        note: 'Check the in-game event calendar to confirm Charm Design is the live reward before you plan around this one.',
        items: {
          'Mythic Hero Shard': { points: 3040 },
          'Hero Gear Essence Stone': { points: 6000 },
          Mithril: { points: 216000 },
        },
        troops: { officer: officerTroops },
      },
    ],
  },

  'armament-tomes': {
    title: 'Armament Competition \u2014 Tomes',
    days: [
      {
        label: 'Tomes',
        items: {
          'Fire Crystal': { points: 100 },
          'Refined Fire Crystal': { points: 1500 },
          'Fire Crystal Shard': { points: 50 },
          Mithril: { points: 28800 },
          'Hero Gear Essence Stone': { points: 800 },
          '1 minute of speedups': { points: 1 },
        },
      },
    ],
  },

  'armament-design': {
    title: 'Armament Competition \u2014 Designs',
    days: [
      {
        label: 'Designs',
        items: {
          'Fire Crystal': { points: 100 },
          'Refined Fire Crystal': { points: 1500 },
          'Fire Crystal Shard': { points: 50 },
          Mithril: { points: 28800 },
          '1 minute of speedups': { points: 1 },
        },
      },
    ],
  },

  custom: {
    title: 'Custom event',
    days: [{ label: '', items: {} }],
  },
};

export const troopTimeOptions: TroopTimeOption[] = [
  { value: 't1_time', label: 'T1', seconds: 45 },
  { value: 't2_time', label: 'T2', seconds: 90 },
  { value: 't3_time', label: 'T3', seconds: 180 },
  { value: 't4_time', label: 'T4', seconds: 360 },
  { value: 't5_time', label: 'T5', seconds: 600 },
  { value: 't6_time', label: 'T6', seconds: 900 },
  { value: 't7_time', label: 'T7', seconds: 1200 },
  { value: 't8_time', label: 'T8', seconds: 1800 },
  { value: 't9_time', label: 'T9', seconds: 2700 },
  { value: 't10_time', label: 'T10', seconds: 3600 },
  { value: 't11_time', label: 'T11', seconds: 5400 },
];

/** Valeria's "Well Prepared" skill \u2014 flat point bonus applied to every SvS day. */
export const valeriaBonusByLevel: Record<number, number> = {
  0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16, 9: 18, 10: 20,
};
