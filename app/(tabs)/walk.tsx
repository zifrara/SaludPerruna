import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '../../src/constants/colors';
import { useDogsStore } from '../../src/store/dogs';
import { useWalksStore, fmtTimer } from '../../src/store/walks';

export default function WalkScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ dogId?: string }>();
  const { dogs, getTodayRecord } = useDogsStore();
  const { activeWalk, selectedDogId, setSelectedDog, startWalk, tickWalk, logEvent, endWalk } = useWalksStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pre-select dog from params (from home screen quick walk)
  useEffect(() => {
    if (params.dogId) {
      setSelectedDog(params.dogId);
    } else if (!selectedDogId && dogs.length > 0) {
      setSelectedDog(dogs[0].id);
    }
  }, [params.dogId, dogs]);

  // Walk timer
  useEffect(() => {
    if (activeWalk) {
      timerRef.current = setInterval(tickWalk, 1000);
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [!!activeWalk]);

  const handleEndWalk = () => {
    endWalk();
    router.replace('/(tabs)');
  };

  // Fall back to first dog so the button always works even before selectedDogId is set
  const effectiveDogId = selectedDogId ?? dogs[0]?.id;
  const activeDog = dogs.find((d) => d.id === (activeWalk?.dogId ?? effectiveDogId));

  // ── Active walk ──
  if (activeWalk) {
    const dog = dogs.find((d) => d.id === activeWalk.dogId);
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: '#15803D' }]} edges={['top']}>
        {/* Header */}
        <View style={styles.walkHeader}>
          <Text style={styles.walkDogName}>{dog?.emoji} {dog?.name}</Text>
          <Text style={styles.walkSubtitle}>Paseo en curso · GPS activo</Text>
          <Animated.Text style={[styles.walkTimer, { transform: [{ scale: pulseAnim }] }]}>
            {fmtTimer(activeWalk.elapsedSeconds)}
          </Animated.Text>
          <View style={styles.walkMetaRow}>
            <Text style={styles.walkMeta}>📍 {activeWalk.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.walkMeta}>💧 {activeWalk.peeCount} pipís</Text>
            <Text style={styles.walkMeta}>💩 {activeWalk.poopCount} cacas</Text>
          </View>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapLabel}>🗺 Ruta en curso…</Text>
          <Text style={styles.mapSub}>GPS activo — integración de mapa disponible con react-native-maps</Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: c.surface }} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.amberPale, borderColor: c.amber }]}
              onPress={() => logEvent('pee')}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBadge}>
                {activeWalk.peeCount > 0 ? ` ×${activeWalk.peeCount}` : ''}
              </Text>
              <Text style={styles.actionEmoji}>💧</Text>
              <Text style={[styles.actionLabel, { color: '#92400E' }]}>Pipí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FEF9C3', borderColor: '#A16207' }]}
              onPress={() => logEvent('poop')}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBadge}>
                {activeWalk.poopCount > 0 ? ` ×${activeWalk.poopCount}` : ''}
              </Text>
              <Text style={styles.actionEmoji}>💩</Text>
              <Text style={[styles.actionLabel, { color: '#713F12' }]}>Caca</Text>
            </TouchableOpacity>
          </View>

          {/* Event log */}
          <Text style={[styles.logTitle, { color: c.fgMuted }]}>Registro del paseo</Text>
          <View style={[styles.logCard, { backgroundColor: c.surface2, borderColor: c.border }]}>
            <LogRow dot={c.green} text="Paseo iniciado" time={fmtHM(activeWalk.startedAt)} />
            {activeWalk.events.map((e, i) => (
              <LogRow
                key={i}
                dot={e.type === 'pee' ? c.amber : '#A16207'}
                text={e.type === 'pee' ? `💧 ${dog?.name} ha hecho pipí` : `💩 ${dog?.name} ha hecho caca`}
                time={fmtHM(e.time)}
              />
            ))}
          </View>

          {/* End button */}
          <TouchableOpacity
            style={[styles.endBtn, { backgroundColor: c.red }]}
            onPress={handleEndWalk}
            activeOpacity={0.85}
          >
            <Text style={styles.endBtnText}>⏹ Terminar paseo</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Idle (no active walk) ──
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.idle}>
        <Text style={styles.idleEmoji}>🦮</Text>
        <Text style={[styles.idleTitle, { color: c.fg }]}>¿A quién paseamos?</Text>
        <Text style={[styles.idleDesc, { color: c.fgMuted }]}>
          Selecciona el perrito y empieza el paseo.{'\n'}Registra pipí, caca y ruta.
        </Text>

        {/* Dog chips */}
        {dogs.length === 0 ? (
          <Text style={[styles.idleDesc, { color: c.fgMuted, marginTop: 8 }]}>
            Primero añade un perrito en la pantalla de inicio.
          </Text>
        ) : (
          <View style={styles.chipsRow}>
            {dogs.map((dog) => (
              <TouchableOpacity
                key={dog.id}
                style={[
                  styles.chip,
                  {
                    borderColor: effectiveDogId === dog.id ? c.green : c.border,
                    backgroundColor: effectiveDogId === dog.id ? c.greenPale : c.surface,
                  },
                ]}
                onPress={() => setSelectedDog(dog.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{dog.emoji}</Text>
                <Text style={[styles.chipName, { color: effectiveDogId === dog.id ? c.greenMid : c.fg }]}>
                  {dog.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {dogs.length > 0 && (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: c.green }]}
            onPress={() => {
              if (effectiveDogId) startWalk(effectiveDogId);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Iniciar paseo 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function LogRow({ dot, text, time }: { dot: string; text: string; time: string }) {
  return (
    <View style={styles.logRow}>
      <View style={[styles.logDot, { backgroundColor: dot }]} />
      <Text style={{ flex: 1, fontSize: 13 }}>{text}</Text>
      <Text style={{ fontSize: 11, color: '#94A3B8' }}>{time}</Text>
    </View>
  );
}

function fmtHM(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.getHours().toString().padStart(2,'0') + ':' + dt.getMinutes().toString().padStart(2,'0');
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  walkHeader: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    backgroundColor: '#15803D',
  },
  walkDogName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  walkSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  walkTimer: {
    color: '#fff', fontSize: 56, fontWeight: '900',
    letterSpacing: -1, marginTop: 10,
  },
  walkMetaRow: { flexDirection: 'row', gap: 20, marginTop: 6 },
  walkMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  mapPlaceholder: {
    height: 140, backgroundColor: '#1a3a28',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  mapLabel: { color: '#fff', fontSize: 20 },
  mapSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', paddingHorizontal: 20 },
  actionRow: { flexDirection: 'row', gap: 12, padding: 16 },
  actionBtn: {
    flex: 1, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', paddingVertical: 18, gap: 6, position: 'relative',
  },
  actionBadge: {
    position: 'absolute', top: 10, right: 10,
    fontSize: 12, fontWeight: '800', color: '#1E293B',
  },
  actionEmoji: { fontSize: 40 },
  actionLabel: { fontSize: 14, fontWeight: '800' },
  logTitle: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 8,
  },
  logCard: {
    marginHorizontal: 16, borderRadius: 12,
    borderWidth: 1, overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0',
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  endBtn: {
    margin: 16, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  endBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  idle: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 12,
  },
  idleEmoji: { fontSize: 72, marginBottom: 8 },
  idleTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  idleDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  chipsRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'column', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 2, gap: 4,
  },
  chipEmoji: { fontSize: 28 },
  chipName: { fontSize: 13, fontWeight: '700' },
  startBtn: {
    marginTop: 16, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 40,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
