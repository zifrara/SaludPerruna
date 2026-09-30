import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '../../src/constants/colors';
import { useDogsStore, getDogStatus } from '../../src/store/dogs';
import { useAuthStore } from '../../src/store/auth';
import { supabase } from '../../src/lib/supabase';
import { DogCard } from '../../src/components/DogCard';
import { fmtHM, useWalksStore } from '../../src/store/walks';

// ─── Types ────────────────────────────────────────────

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const WDAYS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

interface FeedWalk {
  id: string;
  ended_at: string;
  pee_count: number;
  poop_count: number;
  duration_seconds: number;
  started_by_name: string | null;  // guardado directo — sin join FK
  dog_name:        string | null;  // guardado directo — sin join FK
  dog_emoji:       string | null;  // guardado directo — sin join FK
}

interface FeedMeal {
  id: string;
  at: string;               // ISO timestamp del desayuno o cena
  kind: 'breakfast' | 'dinner';
  by_name:   string | null; // guardado directo — sin join FK
  dog_name:  string | null; // guardado directo — sin join FK
  dog_emoji: string | null; // guardado directo — sin join FK
}

// Evento unificado del feed
type FeedItem =
  | { type: 'walk';  ts: string; walk: FeedWalk }
  | { type: 'meal';  ts: string; meal: FeedMeal };

// ─── Component ────────────────────────────────────────

export default function HomeScreen() {
  const c = useColors();

  // dailyRecords subscribed so screen re-renders when pee/poop counts change
  const { dogs, getTodayRecord, dailyRecords } = useDogsStore();
  const { profile } = useAuthStore();
  const pastWalks = useWalksStore((s) => s.pastWalks);

  const [feedItems, setFeedItems]     = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const now     = new Date();
  const dateStr = `${WDAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  const hasUrgent = dogs.some((d) => getDogStatus(getTodayRecord(d.id)) === 'alert');

  // ── Carga del feed familiar ──────────────────────────────────────────────
  const loadFeed = useCallback(() => {
    if (!supabase || !profile?.family_id) {
      setFeedItems([]);
      return;
    }

    setFeedLoading(true);

    // Corte de "hoy" a las 06:00 (igual que el registro diario)
    const cutoff = new Date();
    cutoff.setHours(6, 0, 0, 0);
    if (cutoff > new Date()) cutoff.setDate(cutoff.getDate() - 1);
    const cutoffISO = cutoff.toISOString();
    const today = cutoff.toISOString().split('T')[0];

    const fid = profile.family_id;

    Promise.all([
      supabase
        .from('walks')
        .select('id, ended_at, pee_count, poop_count, duration_seconds, started_by_name, dog_name, dog_emoji')
        .eq('family_id', fid)
        .not('ended_at', 'is', null)
        .gte('ended_at', cutoffISO)
        .order('ended_at', { ascending: false })
        .limit(20),
      supabase
        .from('daily_records')
        .select('id, date, breakfast_at, breakfast_by_name, dinner_at, dinner_by_name, dog_name, dog_emoji')
        .eq('family_id', fid)
        .eq('date', today),
    ]).then(([walksRes, mealsRes]) => {
      if (walksRes.error)
        console.error('[SP feed walks.select]', walksRes.error.message, walksRes.error.details);
      if (mealsRes.error)
        console.error('[SP feed daily_records.select]', mealsRes.error.message, mealsRes.error.details);

      const items: FeedItem[] = [];

      for (const w of ((walksRes.data ?? []) as FeedWalk[])) {
        items.push({ type: 'walk', ts: w.ended_at, walk: w });
      }

      for (const r of (mealsRes.data ?? [])) {
        if (r.breakfast_at) {
          items.push({
            type: 'meal', ts: r.breakfast_at,
            meal: { id: `${r.id}_b`, at: r.breakfast_at, kind: 'breakfast',
              by_name: r.breakfast_by_name ?? null, dog_name: r.dog_name ?? null, dog_emoji: r.dog_emoji ?? null },
          });
        }
        if (r.dinner_at) {
          items.push({
            type: 'meal', ts: r.dinner_at,
            meal: { id: `${r.id}_d`, at: r.dinner_at, kind: 'dinner',
              by_name: r.dinner_by_name ?? null, dog_name: r.dog_name ?? null, dog_emoji: r.dog_emoji ?? null },
          });
        }
      }

      items.sort((a, b) => b.ts.localeCompare(a.ts));
      setFeedItems(items);
      setFeedLoading(false);
    });
  }, [profile?.family_id]);

  // Recargar al volver al tab
  useFocusEffect(useCallback(() => { loadFeed(); }, [loadFeed]));

  // Recargar 1.5 s después de cualquier cambio local (tiempo para que Supabase escriba)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => loadFeed(), 1500);
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyRecords, pastWalks.length]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: c.greenPale }]}>
        <View>
          <Text style={[styles.greeting, { color: c.fgMuted }]}>
            Hola, {profile?.display_name ?? 'amigo'} 👋
          </Text>
          <Text style={[styles.title, { color: c.fg }]}>
            Tus <Text style={{ color: c.greenMid }}>Perritos</Text>
          </Text>
          <Text style={[styles.date, { color: c.fgMuted }]}>{dateStr}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.green }]}
          onPress={() => router.push('/dog/form')}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Alerta urgente ── */}
        {hasUrgent && (
          <View style={[styles.alertBanner, { backgroundColor: c.redPale, borderColor: c.red }]}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: c.red }]}>Atención familiar</Text>
              <Text style={[styles.alertBody, { color: c.red }]}>
                Hay perros que llevan mucho tiempo sin hacer caca. ¿Quién puede sacarlos?
              </Text>
            </View>
          </View>
        )}

        {/* ── Dog cards ── */}
        {dogs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.emptyTitle, { color: c.fg }]}>No hay perritos aún</Text>
            <Text style={[styles.emptyDesc, { color: c.fgMuted }]}>
              Añade a tu primer perruno para empezar a registrar sus paseos y salud.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: c.green }]}
              onPress={() => router.push('/dog/form')}
            >
              <Text style={styles.emptyBtnText}>+ Añadir mi primer perrito</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>Mis perritos</Text>
            {dogs.map((dog) => {
              const record = getTodayRecord(dog.id);
              const status = getDogStatus(record);
              return (
                <View key={dog.id}>
                  <DogCard dog={dog} record={record} />
                  <TouchableOpacity
                    style={[
                      styles.walkBtn,
                      { backgroundColor: status === 'alert' ? c.red : c.green },
                    ]}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/walk', params: { dogId: dog.id } })
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.walkBtnText}>
                      {status === 'alert' ? '🚨' : '🦮'} Pasear a {dog.name}
                      {status === 'alert' ? ' — ¡Urgente!' : ''}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ height: 8 }} />
                </View>
              );
            })}
          </>
        )}

        {/* ── Feed familiar ── */}
        <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>Resumen familiar</Text>

        {!profile?.family_id ? (
          <Text style={[styles.feedEmpty, { color: c.fgMuted }]}>
            Únete a una familia para ver la actividad compartida.
          </Text>
        ) : feedLoading ? (
          <ActivityIndicator color={c.green} style={{ marginTop: 16 }} />
        ) : feedItems.length === 0 ? (
          <Text style={[styles.feedEmpty, { color: c.fgMuted }]}>
            Sin actividad hoy todavía. ¡El primero que salga aparecerá aquí! 🐾
          </Text>
        ) : (
          feedItems.map((item) => {
            if (item.type === 'walk') {
              const w = item.walk;
              const pee  = w.pee_count  > 0 ? ` 💧×${w.pee_count}`  : '';
              const poop = w.poop_count > 0 ? ` 💩×${w.poop_count}` : '';
              const mins = w.duration_seconds > 0
                ? ` · ${Math.round(w.duration_seconds / 60)} min`
                : '';
              const who   = w.started_by_name ?? '¿?';
              const dog   = w.dog_name  ?? '¿?';
              const emoji = w.dog_emoji ?? '🐕';
              return (
                <FeedRow
                  key={w.id}
                  icon={emoji}
                  text={`${who} paseó a ${dog}${pee}${poop}${mins}`}
                  time={fmtHM(w.ended_at)}
                  c={c}
                />
              );
            }

            // meal
            const m      = item.meal;
            const icon   = m.kind === 'breakfast' ? '🍳' : '🍽️';
            const who    = m.by_name   ?? '¿?';
            const dog    = m.dog_name  ?? '¿?';
            const dEmoji = m.dog_emoji ?? '🐕';
            return (
              <FeedRow
                key={m.id}
                icon={icon}
                text={`${who} dio de ${m.kind === 'breakfast' ? 'desayunar' : 'cenar'} a ${dEmoji} ${dog}`}
                time={fmtHM(m.at)}
                c={c}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── FeedRow ──────────────────────────────────────────

function FeedRow({
  icon, text, time, c,
}: { icon: string; text: string; time: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.feedItem, { borderBottomColor: c.border }]}>
      <Text style={styles.feedIcon}>{icon}</Text>
      <Text style={[styles.feedText, { color: c.fg }]}>{text}</Text>
      <Text style={[styles.feedTime, { color: c.fgMuted }]}>{time}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '900', marginTop: 2 },
  date: { fontSize: 13, marginTop: 4 },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
    marginRight: 16,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  addBtnText: { fontSize: 24, color: '#fff', fontWeight: '700', lineHeight: 28 },
  alertBanner: {
    margin: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1.5,
    padding: 12, flexDirection: 'row', gap: 10,
  },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontWeight: '800', fontSize: 13, marginBottom: 2 },
  alertBody: { fontSize: 12, lineHeight: 17 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  walkBtn: {
    marginHorizontal: 16, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    marginTop: 4,
  },
  walkBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 48, gap: 12 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '900' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn: { marginTop: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  feedItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  feedIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  feedText: { flex: 1, fontSize: 13, lineHeight: 18 },
  feedTime: { fontSize: 11 },
  feedEmpty: { fontSize: 13, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 12, lineHeight: 20 },
});
