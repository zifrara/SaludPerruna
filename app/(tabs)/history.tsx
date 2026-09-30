import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../src/constants/colors';
import { useDogsStore } from '../../src/store/dogs';
import { useWalksStore, fmtDuration } from '../../src/store/walks';

export default function HistoryScreen() {
  const c = useColors();
  const { dogs } = useDogsStore();
  const { pastWalks, walkEvents } = useWalksStore();

  const totalKm = pastWalks.reduce((sum, w) => sum + (w.distanceMeters ?? 0) / 1000, 0);
  const totalMin = pastWalks.reduce((sum, w) => {
    if (!w.endedAt) return sum;
    return sum + Math.round((new Date(w.endedAt).getTime() - new Date(w.startedAt).getTime()) / 60000);
  }, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.amberPale }]}>
        <Text style={[styles.title, { color: c.fg }]}>Historial</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatTile icon="🦮" value={String(pastWalks.length)} label="Paseos" c={c} />
          <StatTile icon="📍" value={totalKm.toFixed(1)} label="km totales" c={c} />
          <StatTile icon="⏱" value={totalMin >= 60 ? `${Math.round(totalMin/60)}h` : `${totalMin}m`} label="Tiempo" c={c} />
        </View>

        {/* Walk list */}
        <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>Últimos paseos</Text>
        {pastWalks.length === 0 ? (
          <Text style={[styles.empty, { color: c.fgMuted }]}>Aún no hay paseos registrados.</Text>
        ) : (
          pastWalks.map((walk) => {
            const dog = dogs.find((d) => d.id === walk.dogId);
            const events = walkEvents[walk.id] ?? [];
            const pees  = events.filter((e) => e.type === 'pee').length;
            const poops = events.filter((e) => e.type === 'poop').length;
            const dur   = walk.endedAt ? fmtDuration(walk.startedAt, walk.endedAt) : '—';
            const dist  = walk.distanceMeters ? (walk.distanceMeters / 1000).toFixed(1) + ' km' : null;
            const timeStr = fmtWalkTime(walk.startedAt, walk.endedAt);

            return (
              <View key={walk.id} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dogEmoji}>{dog?.emoji ?? '🐕'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dogName, { color: c.fg }]}>{dog?.name ?? 'Perro'}</Text>
                    <Text style={[styles.walkTime, { color: c.fgMuted }]}>{timeStr}</Text>
                  </View>
                  <Text style={[styles.dur, { color: c.greenMid }]}>{dur}</Text>
                </View>
                <View style={styles.badges}>
                  {pees > 0  && <Badge label={`💧 ${pees} pipí${pees > 1 ? 's' : ''}`}  bg={c.amberPale}   fg="#B45309" />}
                  {poops > 0 && <Badge label={`💩 ${poops} caca${poops > 1 ? 's' : ''}`} bg="#FEF9C3"       fg="#713F12" />}
                  {dist      && <Badge label={`📍 ${dist}`}                                bg={c.bluePale}   fg="#1E40AF" />}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ icon, value, label, c }: { icon: string; value: string; label: string; c: any }) {
  return (
    <View style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={[styles.tileNum, { color: c.fg }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: c.fgMuted }]}>{label}</Text>
    </View>
  );
}

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function fmtWalkTime(start: string, end?: string): string {
  const s = new Date(start);
  const hm = (d: Date) => d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  const isToday = new Date().toDateString() === s.toDateString();
  const prefix = isToday ? 'Hoy' : 'Ayer';
  return end ? `${prefix} · ${hm(s)} – ${hm(new Date(end))}` : `${prefix} · ${hm(s)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, margin: 16, marginBottom: 4 },
  tile: {
    flex: 1, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', paddingVertical: 14,
  },
  tileIcon: { fontSize: 20, marginBottom: 4 },
  tileNum: { fontSize: 26, fontWeight: '900' },
  tileLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, borderWidth: 1.5, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  dogEmoji: { fontSize: 24 },
  dogName: { fontWeight: '800', fontSize: 15 },
  walkTime: { fontSize: 12, marginTop: 1 },
  dur: { fontWeight: '700', fontSize: 15 },
  badges: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 12, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', padding: 32, fontSize: 14 },
});
