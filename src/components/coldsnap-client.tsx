'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type {
  EventKey, ItemCounts, CustomEvents, AccessibilitySettings, TroopEvent, SnipeResult, Snapshot, PointsHistoryEntry,
} from '@/lib/types';
import { tierAtLeast } from '@/lib/types';
import { eventData, valeriaBonusByLevel } from '@/lib/data';
import { solveSniping, type SnipeStock } from '@/lib/sniping';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { SupportBanner } from '@/components/support-banner';
import { PremiumUnlockDialog } from '@/components/premium-unlock-dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip } from 'recharts';

const FREE_CUSTOM_EVENT_LIMIT = 1;
const FREE_SNAPSHOT_LIMIT = 1;
const STORAGE_KEY = 'coldsnap-state-v2';

const EVENT_TABS: { key: EventKey; label: string }[] = [
  { key: 'koi', label: 'KOI' },
  { key: 'svs', label: 'SvS' },
  { key: 'officer-essence', label: 'Officer: Essence' },
  { key: 'officer-charm', label: 'Officer: Charms' },
  { key: 'armament-tomes', label: 'Armament: Tomes' },
  { key: 'armament-design', label: 'Armament: Designs' },
  { key: 'custom', label: 'Custom' },
];

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <circle cx="128" cy="128" r="72" fill="none" stroke="#F5A824" strokeWidth="9" />
      <line x1="128" y1="18" x2="128" y2="46" stroke="#F5A824" strokeWidth="12" strokeLinecap="round" />
      <line x1="128" y1="210" x2="128" y2="238" stroke="#F5A824" strokeWidth="12" strokeLinecap="round" />
      <line x1="18" y1="128" x2="46" y2="128" stroke="#F5A824" strokeWidth="12" strokeLinecap="round" />
      <line x1="210" y1="128" x2="238" y2="128" stroke="#F5A824" strokeWidth="12" strokeLinecap="round" />
      <g stroke="#38C6E0" strokeWidth="12" strokeLinecap="round">
        <line x1="128" y1="74" x2="128" y2="182" />
        <line x1="90.2" y1="90.2" x2="165.8" y2="165.8" />
        <line x1="90.2" y1="165.8" x2="165.8" y2="90.2" />
      </g>
      <circle cx="128" cy="128" r="12" fill="#F5A824" />
    </svg>
  );
}

export default function ColdsnapClient() {
  const { toast } = useToast();
  const { cloudEnabled, isAnonymous, profile, user, saveProfileFields, signInWithGoogle, signOutUser } = useAuth();
  const tier = profile.tier;

  const [currentEvent, setCurrentEvent] = useState<EventKey>('koi');
  const [dayIndex, setDayIndex] = useState(0);
  const [itemCounts, setItemCounts] = useState<ItemCounts>({});
  const [customEvents, setCustomEvents] = useState<CustomEvents>({});
  const [editingCustomEventName, setEditingCustomEventName] = useState('');
  const [valeriaLevel, setValeriaLevel] = useState(0);

  const [snipingEnabled, setSnipingEnabled] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  const [targetGap, setTargetGap] = useState<number | undefined>();
  const [snipeResult, setSnipeResult] = useState<SnipeResult | null>(null);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);

  const [staminaBudget, setStaminaBudget] = useState<number | undefined>();

  const [troopTime, setTroopTime] = useState<number | undefined>();
  const [troopSpeedups, setTroopSpeedups] = useState<number | undefined>();
  const [speedupDays, setSpeedupDays] = useState<number | undefined>();
  const [speedupHours, setSpeedupHours] = useState<number | undefined>();
  const [speedupMinutes, setSpeedupMinutes] = useState<number | undefined>();
  const [troopLevel, setTroopLevel] = useState<number | undefined>();

  const [customEventName, setCustomEventName] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPoints, setCustomItemPoints] = useState('');

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [snapshotName, setSnapshotName] = useState('');

  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    largeText: false, extraLargeText: false, highContrast: false, reducedMotion: false,
  });

  const [isMounted, setIsMounted] = useState(false);
  const cloudLoadedRef = useRef(false);

  const currentEventFull = currentEvent === 'custom'
    ? (customEvents[editingCustomEventName] || eventData.custom)
    : eventData[currentEvent];

  const currentDay = currentEventFull.days[dayIndex] || currentEventFull.days[0];
  const troopEventType: TroopEvent | undefined = currentDay.troops ? (Object.keys(currentDay.troops)[0] as TroopEvent) : undefined;
  const troopTable = troopEventType ? currentDay.troops?.[troopEventType] : undefined;

  // --- Local persistence ---
  useEffect(() => {
    setIsMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setCurrentEvent(data.currentEvent || 'koi');
        setDayIndex(data.dayIndex || 0);
        setItemCounts(data.itemCounts || {});
        setCustomEvents(data.customEvents || {});
        setValeriaLevel(data.valeriaLevel || 0);
        setSnipingEnabled(data.snipingEnabled ?? true);
        setAccessibilitySettings(data.accessibilitySettings || { largeText: false, extraLargeText: false, highContrast: false, reducedMotion: false });
        setSnapshots(data.snapshots || []);
        setPointsHistory(data.pointsHistory || []);
        const firstCustom = Object.keys(data.customEvents || {})[0];
        if (firstCustom) setEditingCustomEventName(firstCustom);
      }
    } catch (e) {
      console.error('Failed to load saved state', e);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentEvent, dayIndex, itemCounts, customEvents, valeriaLevel, snipingEnabled, accessibilitySettings, snapshots, pointsHistory,
      }));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [currentEvent, dayIndex, itemCounts, customEvents, valeriaLevel, snipingEnabled, accessibilitySettings, snapshots, pointsHistory, isMounted]);

  // --- Cloud sync (signed-in, non-anonymous users) ---
  useEffect(() => {
    if (!cloudLoadedRef.current && !isAnonymous && cloudEnabled) {
      if (Object.keys(profile.customEvents || {}).length > 0) setCustomEvents(profile.customEvents);
      if ((profile.snapshots || []).length > 0) setSnapshots(profile.snapshots);
      if ((profile.pointsHistory || []).length > 0) setPointsHistory(profile.pointsHistory);
      cloudLoadedRef.current = true;
    }
  }, [profile, isAnonymous, cloudEnabled]);

  useEffect(() => {
    if (!isMounted || !cloudEnabled || isAnonymous || !user) return;
    const t = setTimeout(() => {
      saveProfileFields({ customEvents, snapshots, pointsHistory });
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customEvents, snapshots, pointsHistory, isMounted, cloudEnabled, isAnonymous, user]);

  // --- Speedup converter ---
  useEffect(() => {
    const days = speedupDays || 0;
    const hours = speedupHours || 0;
    const minutes = speedupMinutes || 0;
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60;
    if (totalSeconds > 0) setTroopSpeedups(totalSeconds);
  }, [speedupDays, speedupHours, speedupMinutes]);

  // --- Accessibility classes ---
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(accessibilitySettings).forEach(([key, value]) => {
      root.classList.toggle(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
    });
  }, [accessibilitySettings]);

  // --- Total points for the current day ---
  useEffect(() => {
    let total = 0;
    const prefix = `${currentEvent}-${editingCustomEventName}-${dayIndex}`;
    Object.entries(currentDay.items).forEach(([itemName, item]) => {
      total += (itemCounts[`${prefix}-${itemName}`] || 0) * item.points;
    });
    if (troopTable && troopLevel && troopTime && troopSpeedups && troopTime > 0) {
      const maxTroops = Math.floor(troopSpeedups / troopTime);
      total += maxTroops * (troopTable[troopLevel] || 0);
    }
    if (currentDay.valeriaEligible && valeriaLevel > 0) {
      total = Math.round(total * (1 + (valeriaBonusByLevel[valeriaLevel] || 0) / 100));
    }
    setTotalPoints(total);
  }, [currentEvent, dayIndex, itemCounts, currentDay, troopTable, troopLevel, troopTime, troopSpeedups, valeriaLevel, editingCustomEventName]);

  // --- Sniping solve (debounced), always fully available — no tier gate ---
  useEffect(() => {
    if (!snipingEnabled || !targetGap || targetGap <= 0) {
      setSnipeResult(null);
      return;
    }
    const t = setTimeout(() => {
      const prefix = `${currentEvent}-${editingCustomEventName}-${dayIndex}`;
      const stocks: SnipeStock[] = Object.entries(currentDay.items).map(([name, item]) => ({
        name,
        unitPoints: item.points,
        batchSize: item.minAmount || 1,
        ownedQuantity: itemCounts[`${prefix}-${name}`] || 0,
      }));
      setSnipeResult(solveSniping(stocks, targetGap));
    }, 250);
    return () => clearTimeout(t);
  }, [snipingEnabled, targetGap, currentDay, itemCounts, currentEvent, dayIndex, editingCustomEventName]);

  const handleItemCountChange = (itemName: string, value: string) => {
    const item = currentDay.items[itemName];
    let numValue = parseInt(value) || 0;
    if (item?.minAmount && numValue > 0 && numValue < item.minAmount) numValue = item.minAmount;
    const key = `${currentEvent}-${editingCustomEventName}-${dayIndex}-${itemName}`;
    setItemCounts((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleAccessibilityChange = (setting: keyof AccessibilitySettings) => {
    setAccessibilitySettings((prev) => {
      const next = { ...prev, [setting]: !prev[setting] };
      if (setting === 'largeText' && next.largeText) next.extraLargeText = false;
      if (setting === 'extraLargeText' && next.extraLargeText) next.largeText = false;
      return next;
    });
  };

  const handleCreateCustomEvent = () => {
    if (!customEventName.trim()) {
      toast({ variant: 'destructive', title: 'Name it first', description: 'Give the event a name.' });
      return;
    }
    if (customEvents[customEventName]) {
      toast({ variant: 'destructive', title: 'Already exists', description: 'Pick a different name.' });
      return;
    }
    if (!tierAtLeast(tier, 'supporter') && Object.keys(customEvents).length >= FREE_CUSTOM_EVENT_LIMIT) {
      toast({ title: 'One custom event on the free tier', description: 'Supporter removes the limit.' });
      setPremiumDialogOpen(true);
      return;
    }
    setCustomEvents((prev) => ({ ...prev, [customEventName]: { title: customEventName, days: [{ label: '', items: {} }] } }));
    setEditingCustomEventName(customEventName);
    setCustomEventName('');
  };

  const handleAddCustomItem = () => {
    if (!editingCustomEventName) {
      toast({ variant: 'destructive', title: 'Pick an event', description: 'Create or select a custom event first.' });
      return;
    }
    const points = parseInt(customItemPoints);
    if (!customItemName.trim() || !customItemPoints.trim() || isNaN(points)) {
      toast({ variant: 'destructive', title: 'Missing a value', description: 'Enter a name and a point value.' });
      return;
    }
    setCustomEvents((prev) => {
      const ev = { ...prev[editingCustomEventName] };
      const day = { ...ev.days[0] };
      day.items = { ...day.items, [customItemName]: { points } };
      ev.days = [day];
      return { ...prev, [editingCustomEventName]: ev };
    });
    setCustomItemName('');
    setCustomItemPoints('');
  };

  const handleRemoveCustomItem = (itemName: string) => {
    if (!editingCustomEventName) return;
    setCustomEvents((prev) => {
      const ev = { ...prev[editingCustomEventName] };
      const day = { ...ev.days[0] };
      const items = { ...day.items };
      delete items[itemName];
      day.items = items;
      ev.days = [day];
      return { ...prev, [editingCustomEventName]: ev };
    });
  };

  const handleRemoveCustomEvent = (eventName: string) => {
    setCustomEvents((prev) => {
      const next = { ...prev };
      delete next[eventName];
      if (editingCustomEventName === eventName) setEditingCustomEventName(Object.keys(next)[0] || '');
      return next;
    });
  };

  const handleSaveSnapshot = () => {
    if (!snapshotName.trim()) {
      toast({ variant: 'destructive', title: 'Name it first', description: 'Give this snapshot a label, like "Week 12 push".' });
      return;
    }
    if (!tierAtLeast(tier, 'supporter') && snapshots.length >= FREE_SNAPSHOT_LIMIT) {
      toast({ title: 'One snapshot on the free tier', description: 'Supporter removes the limit.' });
      setPremiumDialogOpen(true);
      return;
    }
    const prefix = `${currentEvent}-${editingCustomEventName}-${dayIndex}`;
    const relevant: ItemCounts = {};
    Object.entries(itemCounts).forEach(([k, v]) => { if (k.startsWith(prefix)) relevant[k] = v; });
    const snap: Snapshot = {
      id: `${Date.now()}`,
      label: snapshotName.trim(),
      createdAt: Date.now(),
      eventKey: currentEvent,
      dayIndex,
      itemCounts: relevant,
      totalPoints,
    };
    setSnapshots((prev) => [snap, ...prev]);
    setSnapshotName('');
    toast({ title: 'Snapshot saved' });
  };

  const handleLoadSnapshot = (snap: Snapshot) => {
    setCurrentEvent(snap.eventKey as EventKey);
    setDayIndex(snap.dayIndex);
    setItemCounts((prev) => ({ ...prev, ...snap.itemCounts }));
    toast({ title: `Loaded "${snap.label}"` });
  };

  const handleDeleteSnapshot = (id: string) => setSnapshots((prev) => prev.filter((s) => s.id !== id));

  const handleLogHistory = () => {
    if (!tierAtLeast(tier, 'officer')) {
      setPremiumDialogOpen(true);
      return;
    }
    const entry: PointsHistoryEntry = { event: currentEventFull.title, points: totalPoints, date: new Date().toISOString().slice(0, 10) };
    setPointsHistory((prev) => [...prev, entry]);
    toast({ title: 'Logged to your history' });
  };

  const handleDownloadResultCard = () => {
    if (!tierAtLeast(tier, 'officer')) {
      setPremiumDialogOpen(true);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0B1524';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#38C6E0';
    ctx.font = 'bold 42px Arial';
    ctx.fillText('Coldsnap', 48, 80);
    ctx.fillStyle = '#8CA3B8';
    ctx.font = '20px Arial';
    ctx.fillText(`${currentEventFull.title} — ${currentDay.label || ''}`, 48, 120);
    ctx.fillStyle = '#F5A824';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(totalPoints.toLocaleString(), 48, 220);
    ctx.fillStyle = '#8CA3B8';
    ctx.font = '18px Arial';
    ctx.fillText('points', 48, 250);
    if (snipeResult && snipeResult.combo.length > 0) {
      ctx.fillStyle = '#EAF2F8';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Sniping breakdown', 48, 300);
      ctx.font = '18px Arial';
      snipeResult.combo.slice(0, 6).forEach((row, i) => {
        ctx.fillText(`${row.quantity.toLocaleString()} × ${row.item}`, 48, 335 + i * 28);
      });
    }
    const link = document.createElement('a');
    link.download = 'coldsnap-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen font-display text-lg text-muted-foreground">Loading…</div>;
  }

  const showDayStepper = currentEventFull.days.length > 1;
  const staminaCalc = currentDay.special?.beast && currentDay.special?.polarTerror ? currentDay.special : null;

  return (
    <>
      <PremiumUnlockDialog open={premiumDialogOpen} onOpenChange={setPremiumDialogOpen} />
      <SupportBanner onOpenPricing={() => setPremiumDialogOpen(true)} />

      <div className="contour-field">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10" />
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Coldsnap</h1>
                <p className="text-sm text-muted-foreground">Whiteout Survival event points and sniping</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cloudEnabled && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isAnonymous ? <Icons.cloudOff className="h-4 w-4" /> : <Icons.cloud className="h-4 w-4 text-primary" />}
                  {isAnonymous ? 'Not signed in' : 'Signed in'}
                </span>
              )}
              {cloudEnabled && isAnonymous && (
                <Button variant="ghost" size="sm" onClick={signInWithGoogle} className="gap-1.5">
                  <Icons.logIn className="h-4 w-4" /> Sign in
                </Button>
              )}
              {cloudEnabled && !isAnonymous && (
                <Button variant="ghost" size="sm" onClick={signOutUser} className="gap-1.5">
                  <Icons.logOut className="h-4 w-4" /> Sign out
                </Button>
              )}
              <Button onClick={() => setPremiumDialogOpen(true)} variant={tier !== 'free' ? 'secondary' : 'outline'} size="sm" className="gap-1.5">
                {tier === 'officer' && <Icons.crown className="h-4 w-4 text-accent" />}
                {tier === 'supporter' && <Icons.crown className="h-4 w-4" />}
                {tier === 'free' ? 'Supporter & Officer tiers' : tier === 'officer' ? 'Officer' : 'Supporter'}
              </Button>
            </div>
          </header>

          {/* Event tabs */}
          <Tabs value={currentEvent} onValueChange={(v) => { setCurrentEvent(v as EventKey); setDayIndex(0); }}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
              {EVENT_TABS.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="font-display border border-border data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:text-accent rounded-sm">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
            {/* Day stepper */}
            {showDayStepper && (
              <div className="core-line pl-6 flex md:flex-col gap-4 md:gap-6 flex-wrap md:w-56">
                {currentEventFull.days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setDayIndex(i)}
                    className={`text-left -ml-6 pl-6 relative ${i === dayIndex ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ${i === dayIndex ? 'bg-accent' : 'bg-border'}`} />
                    <span className="font-display text-sm">{day.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Day content */}
            <div className="space-y-6 min-w-0">
              <div>
                <h2 className="font-display text-xl">{currentEventFull.title}</h2>
                {currentDay.label && <p className="text-sm text-muted-foreground">{currentDay.label}</p>}
              </div>

              {currentDay.note && (
                <p className="text-sm border-l-2 border-accent pl-3 text-muted-foreground">{currentDay.note}</p>
              )}

              {currentDay.valeriaEligible && (
                <div className="flex flex-wrap items-center gap-3 p-3 border border-accent/40 rounded-sm">
                  <Label htmlFor="valeria" className="text-sm font-display shrink-0">Valeria — Well Prepared level</Label>
                  <Select value={String(valeriaLevel)} onValueChange={(v) => setValeriaLevel(parseInt(v))}>
                    <SelectTrigger id="valeria" className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 11 }, (_, i) => i).map((lvl) => (
                        <SelectItem key={lvl} value={String(lvl)}>{lvl === 0 ? 'Not leveled' : `Level ${lvl} (+${valeriaBonusByLevel[lvl]}%)`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">Applies to every point total on this day.</span>
                </div>
              )}

              {staminaCalc && (
                <div className="p-3 border border-border rounded-sm space-y-3">
                  <p className="font-display text-sm">Stamina planner</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stamina" className="text-sm shrink-0">Stamina available</Label>
                    <Input id="stamina" type="number" className="max-w-[140px]" value={staminaBudget || ''} onChange={(e) => setStaminaBudget(parseInt(e.target.value))} />
                  </div>
                  {staminaBudget ? (
                    <div className="grid sm:grid-cols-2 gap-3 text-sm tabular">
                      <p>{Math.floor(staminaBudget / staminaCalc.beast.stamina).toLocaleString()} Level 26–30 beasts <span className="text-muted-foreground">({(Math.floor(staminaBudget / staminaCalc.beast.stamina) * staminaCalc.beast.points).toLocaleString()} pts)</span></p>
                      <p>{Math.floor(staminaBudget / staminaCalc.polarTerror.stamina).toLocaleString()} Polar Terrors <span className="text-muted-foreground">({(Math.floor(staminaBudget / staminaCalc.polarTerror.stamina) * staminaCalc.polarTerror.points).toLocaleString()} pts)</span></p>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Each option assumes you spend all your stamina on that target alone.</p>}
                </div>
              )}

              {currentEvent === 'custom' && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="custom-builder">
                    <AccordionTrigger className="font-display text-sm">Manage custom events</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="flex flex-wrap items-end gap-2">
                        {Object.keys(customEvents).map((name) => (
                          <Button key={name} size="sm" variant={editingCustomEventName === name ? 'default' : 'outline'} onClick={() => setEditingCustomEventName(name)} className="gap-1.5">
                            {name}
                            <Icons.close className="h-3 w-3 opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRemoveCustomEvent(name); }} />
                          </Button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Input placeholder="Event name" value={customEventName} onChange={(e) => setCustomEventName(e.target.value)} className="max-w-xs" />
                        <Button onClick={handleCreateCustomEvent} variant="secondary" className="gap-1.5"><Icons.plusCircle className="h-4 w-4" /> Create</Button>
                      </div>
                      {!tierAtLeast(tier, 'supporter') && <p className="text-xs text-muted-foreground">Free tier: {FREE_CUSTOM_EVENT_LIMIT} custom event. Supporter removes the limit.</p>}
                      {editingCustomEventName && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          <Input placeholder="Item name" value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} className="max-w-xs" />
                          <Input placeholder="Points" type="number" value={customItemPoints} onChange={(e) => setCustomItemPoints(e.target.value)} className="max-w-[120px]" />
                          <Button onClick={handleAddCustomItem} variant="outline" className="gap-1.5"><Icons.plusCircle className="h-4 w-4" /> Add item</Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Items — flat divided rows instead of a card grid */}
              <div className="border border-border rounded-sm divide-y divide-border">
                {Object.entries(currentDay.items).map(([name, item]) => (
                  <div key={name} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm">{name}</p>
                      <p className="tabular text-xs text-accent">{item.points.toLocaleString()} pts each{item.minAmount ? ` · min ${item.minAmount}` : ''}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      step={item.minAmount || 1}
                      className="max-w-[140px] shrink-0"
                      placeholder="Owned"
                      value={itemCounts[`${currentEvent}-${editingCustomEventName}-${dayIndex}-${name}`] || ''}
                      onChange={(e) => handleItemCountChange(name, e.target.value)}
                    />
                    {currentEvent === 'custom' && (
                      <button onClick={() => handleRemoveCustomItem(name)} aria-label={`Remove ${name}`}><Icons.close className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                    )}
                  </div>
                ))}
                {Object.keys(currentDay.items).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {currentEvent === 'custom' ? 'Add items above to start.' : 'No items on this day.'}
                  </p>
                )}
              </div>

              {/* Troop training */}
              {troopTable && (
                <div className="p-4 border border-border rounded-sm space-y-3">
                  <p className="font-display text-sm flex items-center gap-1.5"><Icons.helmet className="h-4 w-4" /> Troop training</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="troop-level" className="text-sm">Troop level</Label>
                      <Select value={troopLevel?.toString()} onValueChange={(v) => setTroopLevel(parseInt(v))}>
                        <SelectTrigger id="troop-level"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(troopTable).map((lvl) => <SelectItem key={lvl} value={lvl}>Level {lvl}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="troop-time" className="text-sm">Base time per troop (seconds)</Label>
                      <Input id="troop-time" type="number" placeholder="e.g. 5400" value={troopTime || ''} onChange={(e) => setTroopTime(parseInt(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Speedups you have</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="Days" value={speedupDays || ''} onChange={(e) => setSpeedupDays(parseInt(e.target.value) || 0)} />
                      <Input type="number" placeholder="Hours" value={speedupHours || ''} onChange={(e) => setSpeedupHours(parseInt(e.target.value) || 0)} />
                      <Input type="number" placeholder="Mins" value={speedupMinutes || ''} onChange={(e) => setSpeedupMinutes(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  {troopLevel && troopTime && troopSpeedups ? (
                    <p className="text-sm tabular text-muted-foreground">
                      {Math.floor(troopSpeedups / (troopTime || 1)).toLocaleString()} troops trainable → <span className="text-accent">{(Math.floor(troopSpeedups / (troopTime || 1)) * (troopTable[troopLevel] || 0)).toLocaleString()} pts</span>
                    </p>
                  ) : <p className="text-xs text-muted-foreground">Fill in level, time, and speedups to see points.</p>}
                </div>
              )}

              {/* Sniping */}
              <div className="p-4 border border-border rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm flex items-center gap-1.5"><Icons.crosshair className="h-4 w-4" /> Sniping</p>
                  <Switch checked={snipingEnabled} onCheckedChange={setSnipingEnabled} />
                </div>
                {snipingEnabled && (
                  <>
                    <div>
                      <Label htmlFor="target-gap" className="text-sm">Points you need to close</Label>
                      <Input id="target-gap" type="number" placeholder="e.g. 48000" value={targetGap || ''} onChange={(e) => setTargetGap(parseInt(e.target.value))} />
                    </div>
                    <div className="min-h-[80px]">
                      {snipeResult && snipeResult.combo.length > 0 ? (
                        <div className="space-y-2">
                          <Table>
                            <TableHeader>
                              <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Spend</TableHead><TableHead className="text-right">Points</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                              {snipeResult.combo.map((row, i) => (
                                <TableRow key={i}>
                                  <TableCell>{row.item}</TableCell>
                                  <TableCell className="text-right tabular">{row.quantity.toLocaleString()}</TableCell>
                                  <TableCell className="text-right tabular">{row.points.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <p className="text-xs text-muted-foreground">
                            Total {snipeResult.totalPoints.toLocaleString()} pts{snipeResult.overshoot > 0 && <> ({snipeResult.overshoot.toLocaleString()} over target)</>}
                            {snipeResult.fellBackToGreedy && <> — close estimate, not guaranteed cheapest</>}
                          </p>
                          {tierAtLeast(tier, 'officer') && (
                            <Button size="sm" variant="outline" onClick={handleDownloadResultCard} className="gap-1.5">
                              <Icons.download className="h-4 w-4" /> Download result card
                            </Button>
                          )}
                        </div>
                      ) : <p className="text-xs text-muted-foreground pt-2">{targetGap ? 'Not enough of anything on hand to close this gap yet.' : 'Enter what you own above, then a point gap here.'}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Snapshots */}
          <Accordion type="single" collapsible>
            <AccordionItem value="snapshots">
              <AccordionTrigger className="font-display text-sm">Saved snapshots</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Label, e.g. Week 12 push" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} className="max-w-xs" />
                  <Button onClick={handleSaveSnapshot} variant="outline" size="sm">Save current as snapshot</Button>
                </div>
                {!tierAtLeast(tier, 'supporter') && <p className="text-xs text-muted-foreground">Free tier: {FREE_SNAPSHOT_LIMIT} snapshot. Supporter removes the limit.</p>}
                {snapshots.length > 0 ? (
                  <div className="divide-y divide-border border border-border rounded-sm">
                    {snapshots.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div>
                          <p>{s.label}</p>
                          <p className="text-xs text-muted-foreground tabular">{s.totalPoints.toLocaleString()} pts · {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleLoadSnapshot(s)}>Load</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteSnapshot(s.id)}><Icons.trash className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No snapshots yet.</p>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Officer: history */}
          <Accordion type="single" collapsible>
            <AccordionItem value="history">
              <AccordionTrigger className="font-display text-sm">Point history {tier !== 'officer' && <span className="ml-2 text-xs text-muted-foreground">(Officer)</span>}</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {tierAtLeast(tier, 'officer') ? (
                  <>
                    <Button size="sm" variant="outline" onClick={handleLogHistory}>Log today's total ({totalPoints.toLocaleString()} pts)</Button>
                    {pointsHistory.length > 1 ? (
                      <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={pointsHistory.map((h, i) => ({ ...h, i }))}>
                            <CartesianGrid stroke="hsl(213 28% 20%)" vertical={false} />
                            <XAxis dataKey="date" stroke="hsl(205 18% 65%)" fontSize={12} />
                            <YAxis stroke="hsl(205 18% 65%)" fontSize={12} />
                            <RTooltip contentStyle={{ background: '#101E30', border: '1px solid hsl(213 28% 20%)' }} />
                            <Line type="monotone" dataKey="points" stroke="#38C6E0" strokeWidth={2} dot={{ fill: '#38C6E0' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <p className="text-xs text-muted-foreground">Log a couple of totals to see a trend line.</p>}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Track your point totals over time with the Officer tier.</p>
                    <Button size="sm" onClick={() => setPremiumDialogOpen(true)}>See Officer tier</Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Accessibility */}
          <Accordion type="single" collapsible>
            <AccordionItem value="accessibility">
              <AccordionTrigger className="font-display text-sm">Accessibility</AccordionTrigger>
              <AccordionContent className="flex flex-wrap gap-4">
                {(['largeText', 'extraLargeText', 'highContrast', 'reducedMotion'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch id={key} checked={accessibilitySettings[key]} onCheckedChange={() => handleAccessibilityChange(key)} />
                    <Label htmlFor={key} className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{currentEventFull.title}{currentDay.label ? ` · ${currentDay.label}` : ''}</p>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total points</p>
            <p className="font-display tabular text-3xl md:text-4xl font-bold tracking-tight animate-tick" key={totalPoints}>{totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </>
  );
}
