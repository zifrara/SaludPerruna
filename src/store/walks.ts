import { create } from 'zustand';
import type { Walk, WalkEvent } from '../types';
import { useDogsStore } from './dogs';
import { supabase } from '../lib/supabase';

/** UUID v4 compatible con la PK uuid de Supabase */
function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── State ────────────────────────────────────────────

interface ActiveWalk {
  walkId: string;
  dogId: string;
  startedAt: Date;
  elapsedSeconds: number;
  distanceKm: number;
  peeCount: number;
  poopCount: number;
  events: { type: 'pee' | 'poop'; time: Date }[];
}

interface WalksState {
  pastWalks: Walk[];
  walkEvents: Record<string, WalkEvent[]>; // keyed by walkId
  activeWalk: ActiveWalk | null;
  selectedDogId: string | null;

  setSelectedDog: (dogId: string) => void;
  startWalk: (dogId: string) => void;
  tickWalk: () => void;
  logEvent: (type: 'pee' | 'poop') => void;
  endWalk: () => Walk | null;
  clearActive: () => void;
}

// ─── Store ────────────────────────────────────────────

export const useWalksStore = create<WalksState>()((set, get) => ({
  pastWalks:    [],
  walkEvents:   {},
  activeWalk:   null,
  selectedDogId: null,

  setSelectedDog: (dogId) => set({ selectedDogId: dogId }),

  startWalk: (dogId) => {
    if (get().activeWalk) return; // ya hay un paseo activo
    set({
      activeWalk: {
        walkId: genId(),
        dogId,
        startedAt: new Date(),
        elapsedSeconds: 0,
        distanceKm: 0,
        peeCount: 0,
        poopCount: 0,
        events: [],
      },
    });
  },

  tickWalk: () => {
    const w = get().activeWalk;
    if (!w) return;
    set({
      activeWalk: {
        ...w,
        elapsedSeconds: w.elapsedSeconds + 1,
        distanceKm: parseFloat((w.elapsedSeconds * 0.0014).toFixed(2)),
      },
    });
  },

  logEvent: (type) => {
    const w = get().activeWalk;
    if (!w) return;
    const event = { type, time: new Date() };
    set({
      activeWalk: {
        ...w,
        peeCount:  type === 'pee'  ? w.peeCount  + 1 : w.peeCount,
        poopCount: type === 'poop' ? w.poopCount + 1 : w.poopCount,
        events: [...w.events, event],
      },
    });
    // Actualizar el registro diario del perro (con sync a Supabase incluido)
    if (type === 'pee') useDogsStore.getState().incrementPee(w.dogId);
    else                useDogsStore.getState().incrementPoop(w.dogId);
  },

  endWalk: () => {
    const w = get().activeWalk;
    if (!w) return null;

    const endedAt = new Date();
    const finished: Walk = {
      id:             w.walkId,
      dogId:          w.dogId,
      userId:         'me',
      startedAt:      w.startedAt.toISOString(),
      endedAt:        endedAt.toISOString(),
      distanceMeters: Math.round(w.distanceKm * 1000),
    };

    const events: WalkEvent[] = w.events.map((e) => ({
      id:         genId(),
      walkId:     w.walkId,
      type:       e.type,
      recordedAt: e.time.toISOString(),
    }));

    set((s) => ({
      activeWalk: null,
      pastWalks: [finished, ...s.pastWalks],
      walkEvents: { ...s.walkEvents, [w.walkId]: events },
    }));

    // Registrar el paseo en el record diario del perro (con o sin eventos)
    useDogsStore.getState().recordWalkEnd(w.dogId, endedAt.toISOString());

    // ── Guardar en Supabase (con log de errores visible en Expo) ───────────
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useAuthStore } = require('./auth') as typeof import('./auth');
    const { profile, user } = useAuthStore.getState();

    // Datos del perro guardados directamente — sin joins FK en el feed
    const dog = useDogsStore.getState().getDog(w.dogId);

    if (supabase && profile?.family_id) {
      const walkPayload = {
        id:               w.walkId,
        family_id:        profile.family_id,
        dog_id:           w.dogId,
        dog_name:         dog?.name  ?? null,
        dog_emoji:        dog?.emoji ?? null,
        started_by:       user?.id   ?? null,
        started_by_name:  profile.display_name ?? null,
        started_at:       w.startedAt.toISOString(),
        ended_at:         endedAt.toISOString(),
        distance_meters:  Math.round(w.distanceKm * 1000),
        pee_count:        w.peeCount,
        poop_count:       w.poopCount,
        duration_seconds: w.elapsedSeconds,
      };

      // Upsertear el perro primero para garantizar que el FK dog_id existe en Supabase
      const doInsertWalk = () =>
        supabase!.from('walks').insert(walkPayload).then((res) => {
          if (res.error) console.error('[SP walks.insert]', res.error.message, res.error.details);
        });

      if (dog) {
        supabase.from('dogs').upsert(
          { id: w.dogId, family_id: profile.family_id, name: dog.name, emoji: dog.emoji },
          { onConflict: 'id' }
        ).then((res) => {
          if (res.error) console.error('[SP dogs.upsert before walk]', res.error.message);
          doInsertWalk();
        });
      } else {
        doInsertWalk();
      }

      // Guardar los eventos del paseo
      if (events.length > 0) {
        supabase.from('walk_events').insert(
          events.map((e) => ({
            id:          e.id,
            walk_id:     w.walkId,
            dog_id:      w.dogId,
            family_id:   profile.family_id,
            type:        e.type,
            recorded_at: e.recordedAt,
          }))
        ).then((res) => {
          if (res.error) console.error('[SP walk_events.insert]', res.error.message);
        });
      }
    }

    return finished;
  },

  clearActive: () => set({ activeWalk: null }),
}));

// ─── Helpers ──────────────────────────────────────────

export function fmtTimer(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function fmtDuration(startIso: string, endIso: string): string {
  const secs = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  return fmtTimer(secs);
}

/** Formatea una fecha ISO a "HH:MM" en hora local */
export function fmtHM(iso: string): string {
  const d = new Date(iso);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}
