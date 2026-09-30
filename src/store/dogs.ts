import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dog, DailyRecord } from '../types';
import { supabase } from '../lib/supabase';

// ─── Helpers ──────────────────────────────────────────

/**
 * "Dog day" key: el registro diario se reinicia a las 06:00 (no a medianoche).
 * Antes de las 6h seguimos mostrando el registro del día anterior.
 */
function dogDayKey(): string {
  const now = new Date();
  const shifted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  return shifted.toISOString().split('T')[0]; // YYYY-MM-DD
}

/** UUID v4 generado en cliente — compatible con la PK de Supabase. */
function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Comprueba si un timestamp ISO tiene más de 6 horas de antigüedad. */
function isOlderThan6h(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > SIX_HOURS_MS;
}

/**
 * Aplica la regla de reset rolling de 6 horas a pipí y caca.
 * Si el último evento fue hace más de 6 horas, el contador se muestra como 0.
 * No modifica el registro almacenado — solo devuelve una vista corregida.
 */
function applyStaleReset(rec: DailyRecord): DailyRecord {
  const peeCount  = rec.peeCount  > 0 && rec.lastPeeAt  && isOlderThan6h(rec.lastPeeAt)
    ? 0 : rec.peeCount;
  const poopCount = rec.poopCount > 0 && rec.lastPoopAt && isOlderThan6h(rec.lastPoopAt)
    ? 0 : rec.poopCount;
  return { ...rec, peeCount, poopCount };
}

function defaultRecord(dogId: string): DailyRecord {
  const day = dogDayKey();
  return {
    id: `${dogId}_${day}`,
    dogId,
    date: day,
    peeCount: 0,
    poopCount: 0,
    walkCount: 0,
  };
}

/**
 * Upsert de daily_record en Supabase (con log de error visible en Expo).
 * Upsertea el perro primero para evitar errores de FK ("Key is not present in table Dogs").
 * userId      = UUID de quien hizo la acción.
 * displayName = nombre visible guardado directamente — no requiere join FK.
 * dog         = datos del perro — se upsertea antes que el record.
 */
function upsertRecord(
  rec: DailyRecord,
  familyId: string,
  userId?: string,
  displayName?: string,
  dog?: { name: string; emoji: string },
) {
  if (!supabase || !familyId) return;

  const payload = {
    id:                 rec.id,
    dog_id:             rec.dogId,
    family_id:          familyId,
    date:               rec.date,
    dog_name:           dog?.name  ?? null,
    dog_emoji:          dog?.emoji ?? null,
    pee_count:          rec.peeCount,
    poop_count:         rec.poopCount,
    last_pee_at:        rec.lastPeeAt  ?? null,
    last_poop_at:       rec.lastPoopAt ?? null,
    walk_count:         rec.walkCount,
    last_walk_at:       rec.lastWalkAt ?? null,
    breakfast_at:       rec.breakfastAt ?? null,
    breakfast_by:       rec.breakfastAt ? (userId      ?? null) : null,
    breakfast_by_name:  rec.breakfastAt ? (displayName ?? null) : null,
    dinner_at:          rec.dinnerAt ?? null,
    dinner_by:          rec.dinnerAt ? (userId      ?? null) : null,
    dinner_by_name:     rec.dinnerAt ? (displayName ?? null) : null,
    updated_at:         new Date().toISOString(),
  };

  const doUpsert = () =>
    supabase!.from('daily_records')
      .upsert(payload, { onConflict: 'id' })
      .then((res) => {
        if (res.error) console.error('[SP daily_records.upsert]', res.error.message, res.error.details);
      });

  // Upsertear el perro primero para garantizar que el FK dog_id existe en Supabase
  if (dog) {
    supabase.from('dogs').upsert(
      { id: rec.dogId, family_id: familyId, name: dog.name, emoji: dog.emoji },
      { onConflict: 'id' }
    ).then((res) => {
      if (res.error) console.error('[SP dogs.upsert]', res.error.message);
      doUpsert();
    });
  } else {
    doUpsert();
  }
}

// ─── State shape ──────────────────────────────────────

interface DogsState {
  dogs: Dog[];
  dailyRecords: Record<string, DailyRecord>; // key: `${dogId}_${date}`

  addDog: (dog: Omit<Dog, 'id' | 'familyId' | 'createdAt'>) => Dog;
  updateDog: (id: string, patch: Partial<Dog>) => void;
  deleteDog: (id: string) => void;
  getDog: (id: string) => Dog | undefined;

  /**
   * Devuelve el registro de hoy con reset rolling de 6h aplicado a pipí/caca.
   * peeCount y poopCount se muestran como 0 si el último evento fue hace >6h.
   */
  getTodayRecord: (dogId: string) => DailyRecord;
  toggleMeal: (dogId: string, meal: 'breakfast' | 'dinner') => void;
  incrementPee: (dogId: string) => void;
  incrementPoop: (dogId: string) => void;
  /** Registra que se ha terminado un paseo (con o sin eventos). */
  recordWalkEnd: (dogId: string, endedAt: string) => void;

  /** Reemplaza el estado local con los datos reales de Supabase. */
  syncFromSupabase: (familyId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────

export const useDogsStore = create<DogsState>()(
  persist(
    (set, get) => ({
      // Sin perros demo: cuando hay Supabase real, syncFromSupabase los carga.
      // En modo offline (sin Supabase) el usuario añade sus propios perritos.
      dogs: [],
      dailyRecords: {},

      // ── CRUD ──────────────────────────────────────────────────────────────

      addDog: (data) => {
        // Importación lazy para evitar dependencias circulares en el módulo
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile, user } = useAuthStore.getState();
        const familyId = profile?.family_id ?? 'demo';
        const id = genId();

        const dog: Dog = { ...data, id, familyId, createdAt: new Date().toISOString() };
        set((s) => ({ dogs: [...s.dogs, dog] }));

        // Sync a Supabase (fire-and-forget)
        if (supabase && profile?.family_id) {
          supabase.from('dogs').insert({
            id,
            family_id: profile.family_id,
            name:       data.name,
            emoji:      data.emoji,
            bg_color:   data.bgColor,
            breed:      data.breed    || null,
            birth_date: data.birthDate || null,
            weight:     data.weight   || null,
            vet_name:   data.vetName  || null,
            vet_phone:  data.vetPhone || null,
            notes:      data.notes    || null,
            created_by: user?.id      ?? null,
          }).then(() => {});
        }

        return dog;
      },

      updateDog: (id, patch) => {
        set((s) => ({
          dogs: s.dogs.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }));

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile } = useAuthStore.getState();
        if (supabase && profile?.family_id) {
          const dbPatch: Record<string, unknown> = {};
          if (patch.name      !== undefined) dbPatch.name       = patch.name;
          if (patch.emoji     !== undefined) dbPatch.emoji      = patch.emoji;
          if (patch.bgColor   !== undefined) dbPatch.bg_color   = patch.bgColor;
          if (patch.breed     !== undefined) dbPatch.breed      = patch.breed;
          if (patch.birthDate !== undefined) dbPatch.birth_date = patch.birthDate;
          if (patch.weight    !== undefined) dbPatch.weight     = patch.weight;
          if (patch.vetName   !== undefined) dbPatch.vet_name   = patch.vetName;
          if (patch.vetPhone  !== undefined) dbPatch.vet_phone  = patch.vetPhone;
          if (patch.notes     !== undefined) dbPatch.notes      = patch.notes;
          supabase.from('dogs').update(dbPatch).eq('id', id).then(() => {});
        }
      },

      deleteDog: (id) => {
        set((s) => ({
          dogs: s.dogs.filter((d) => d.id !== id),
          dailyRecords: Object.fromEntries(
            Object.entries(s.dailyRecords).filter(([k]) => !k.startsWith(id + '_'))
          ),
        }));

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile } = useAuthStore.getState();
        if (supabase && profile?.family_id) {
          supabase.from('dogs').delete().eq('id', id).then(() => {});
        }
      },

      getDog: (id) => get().dogs.find((d) => d.id === id),

      // ── Daily records ──────────────────────────────────────────────────────

      /**
       * Devuelve el registro diario de hoy con reset rolling de 6h:
       * - peeCount  → 0 si lastPeeAt  fue hace >6 horas
       * - poopCount → 0 si lastPoopAt fue hace >6 horas
       */
      getTodayRecord: (dogId) => {
        const key = `${dogId}_${dogDayKey()}`;
        const raw = get().dailyRecords[key] ?? defaultRecord(dogId);
        return applyStaleReset(raw);
      },

      toggleMeal: (dogId, meal) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile, user } = useAuthStore.getState();

        const key   = `${dogId}_${dogDayKey()}`;
        const rec   = get().dailyRecords[key] ?? defaultRecord(dogId);
        const field = meal === 'breakfast' ? 'breakfastAt' : 'dinnerAt';
        const newRec: DailyRecord = {
          ...rec,
          [field]: rec[field] ? undefined : new Date().toISOString(),
        };
        set((s) => ({ dailyRecords: { ...s.dailyRecords, [key]: newRec } }));
        const dog = get().dogs.find((d) => d.id === dogId);
        if (profile?.family_id)
          upsertRecord(newRec, profile.family_id, user?.id, profile.display_name ?? undefined, dog);
      },

      incrementPee: (dogId) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile, user } = useAuthStore.getState();

        const now = new Date().toISOString();
        const key = `${dogId}_${dogDayKey()}`;
        const rec = get().dailyRecords[key] ?? defaultRecord(dogId);

        // Si el último pipí fue hace >6h, resetear contador a 1 (no acumular sobre datos caducados)
        const prevCount = rec.peeCount > 0 && rec.lastPeeAt && isOlderThan6h(rec.lastPeeAt)
          ? 0 : rec.peeCount;
        const newRec: DailyRecord = { ...rec, peeCount: prevCount + 1, lastPeeAt: now };
        const dog = get().dogs.find((d) => d.id === dogId);

        set((s) => ({ dailyRecords: { ...s.dailyRecords, [key]: newRec } }));
        if (profile?.family_id)
          upsertRecord(newRec, profile.family_id, user?.id, profile.display_name ?? undefined, dog);
      },

      incrementPoop: (dogId) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile, user } = useAuthStore.getState();

        const now = new Date().toISOString();
        const key = `${dogId}_${dogDayKey()}`;
        const rec = get().dailyRecords[key] ?? defaultRecord(dogId);

        // Si la última caca fue hace >6h, resetear contador a 1
        const prevCount = rec.poopCount > 0 && rec.lastPoopAt && isOlderThan6h(rec.lastPoopAt)
          ? 0 : rec.poopCount;
        const newRec: DailyRecord = { ...rec, poopCount: prevCount + 1, lastPoopAt: now };
        const dog = get().dogs.find((d) => d.id === dogId);

        set((s) => ({ dailyRecords: { ...s.dailyRecords, [key]: newRec } }));
        if (profile?.family_id)
          upsertRecord(newRec, profile.family_id, user?.id, profile.display_name ?? undefined, dog);
      },

      recordWalkEnd: (dogId, endedAt) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useAuthStore } = require('./auth') as typeof import('./auth');
        const { profile, user } = useAuthStore.getState();

        const key    = `${dogId}_${dogDayKey()}`;
        const rec    = get().dailyRecords[key] ?? defaultRecord(dogId);
        const newRec: DailyRecord = {
          ...rec,
          walkCount:  rec.walkCount + 1,
          lastWalkAt: endedAt,
        };
        const dog = get().dogs.find((d) => d.id === dogId);

        set((s) => ({ dailyRecords: { ...s.dailyRecords, [key]: newRec } }));
        if (profile?.family_id)
          upsertRecord(newRec, profile.family_id, user?.id, profile.display_name ?? undefined, dog);
      },

      // ── Supabase sync ──────────────────────────────────────────────────────

      syncFromSupabase: async (familyId) => {
        if (!supabase) return;

        // Cargar perros de la familia
        const { data: rawDogs } = await supabase
          .from('dogs')
          .select('*')
          .eq('family_id', familyId);

        if (!rawDogs) return;

        // ── Supabase devuelve vacío: conservar perros locales y re-subirlos ──
        // Esto ocurre cuando los perros no llegaron a guardarse en Supabase
        // (RLS sin configurar o primer arranque). Evita borrar el estado local.
        if (rawDogs.length === 0) {
          const localDogs = get().dogs;
          if (localDogs.length > 0) {
            // Re-subir perros locales a Supabase (upsert por si alguno ya existe)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { useAuthStore } = require('./auth') as typeof import('./auth');
            const { user } = useAuthStore.getState();
            supabase.from('dogs').upsert(
              localDogs.map((d) => ({
                id:         d.id,
                family_id:  familyId,
                name:       d.name,
                emoji:      d.emoji,
                bg_color:   d.bgColor,
                breed:      d.breed    || null,
                birth_date: d.birthDate || null,
                weight:     d.weight   || null,
                vet_name:   d.vetName  || null,
                vet_phone:  d.vetPhone || null,
                notes:      d.notes    || null,
                created_by: user?.id   ?? null,
              })),
              { onConflict: 'id' }
            ).then(() => {});
          }
          // No sobreescribir: los perros locales se conservan tal cual
          return;
        }

        const mapped: Dog[] = rawDogs.map((d) => ({
          id:        d.id,
          familyId:  d.family_id,
          name:      d.name,
          emoji:     d.emoji,
          bgColor:   d.bg_color  ?? '#FEF9C3',
          breed:     d.breed     ?? '',
          birthDate: d.birth_date ?? '',
          weight:    d.weight    ?? 0,
          vetName:   d.vet_name  ?? '',
          vetPhone:  d.vet_phone ?? '',
          notes:     d.notes     ?? '',
          createdAt: d.created_at,
        }));

        // Cargar registros de hoy para todos los perros
        const today  = dogDayKey();
        const dogIds = mapped.map((d) => d.id);
        let dailyRecords: Record<string, DailyRecord> = {};

        if (dogIds.length > 0) {
          const { data: rawRecords } = await supabase
            .from('daily_records')
            .select('*')
            .in('dog_id', dogIds)
            .eq('date', today);

          if (rawRecords) {
            rawRecords.forEach((r) => {
              const key = `${r.dog_id}_${r.date}`;
              dailyRecords[key] = {
                id:          r.id,
                dogId:       r.dog_id,
                date:        r.date,
                peeCount:    r.pee_count,
                poopCount:   r.poop_count,
                lastPeeAt:   r.last_pee_at  ?? undefined,
                lastPoopAt:  r.last_poop_at ?? undefined,
                walkCount:   r.walk_count   ?? 0,
                lastWalkAt:  r.last_walk_at ?? undefined,
                breakfastAt: r.breakfast_at ?? undefined,
                dinnerAt:    r.dinner_at    ?? undefined,
              };
            });
          }
        }

        set({ dogs: mapped, dailyRecords });
      },
    }),
    {
      name: 'salud-perruna-dogs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Derived helpers ──────────────────────────────────

/**
 * Determina el estado de salud del perro para la home screen.
 * Recibe el registro YA con applyStaleReset aplicado (via getTodayRecord).
 */
export function getDogStatus(rec: DailyRecord): 'ok' | 'alert' | 'warn' {
  const hasWalked = rec.walkCount > 0;
  if (rec.poopCount === 0 && !hasWalked) return 'alert';  // no ha salido ni hecho caca
  if (rec.poopCount === 0 && hasWalked)  return 'warn';   // ha salido pero sin caca
  if (!rec.breakfastAt)                  return 'warn';   // no ha desayunado
  return 'ok';
}
