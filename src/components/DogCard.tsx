import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import type { Dog, DailyRecord } from '../types';
import { useColors } from '../constants/colors';
import { useDogsStore, getDogStatus } from '../store/dogs';

interface Props {
  dog: Dog;
  record: DailyRecord;
}

export function DogCard({ dog, record }: Props) {
  const c = useColors();
  const { toggleMeal, incrementPee, incrementPoop } = useDogsStore();
  const status = getDogStatus(record);

  const ringColor = status === 'alert' ? c.red : status === 'warn' ? c.amber : c.green;
  const pillBg    = status === 'alert' ? c.redPale   : status === 'warn' ? c.amberPale   : c.greenPale;
  const pillText  = status === 'alert' ? c.red        : status === 'warn' ? '#B45309'     : c.greenMid;
  const pillLabel = status === 'alert' ? '⚠ Necesita salir' : status === 'warn' ? '🍳 Sin desayuno' : '✓ Todo bien hoy';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface },
      ]}
      onPress={() => router.push(`/dog/${dog.id}`)}
    >
      <View>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: dog.bgColor, shadowColor: ringColor, borderColor: ringColor }]}>
            <Text style={styles.avatarEmoji}>{dog.emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: c.fg }]}>{dog.name}</Text>
            <Text style={[styles.breed, { color: c.fgMuted }]}>
              {dog.breed || 'Sin raza'}
              {dog.birthDate ? ` · ${calcAge(dog.birthDate)}` : ''}
            </Text>
            <View style={[styles.pill, { backgroundColor: pillBg }]}>
              <Text style={[styles.pillText, { color: pillText }]}>{pillLabel}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: c.border, backgroundColor: c.surface2 }]}>
          <StatButton
            icon="🍳" label="Desayuno"
            active={!!record.breakfastAt}
            onPress={() => toggleMeal(dog.id, 'breakfast')}
            c={c}
          />
          <StatButton
            icon="🍖" label="Cena"
            active={!!record.dinnerAt}
            onPress={() => toggleMeal(dog.id, 'dinner')}
            c={c}
            noBorder={false}
          />
          <StatButton
            icon="💧" label="Pipí"
            count={record.peeCount}
            active={record.peeCount > 0}
            onPress={() => incrementPee(dog.id)}
            c={c}
            noBorder={false}
          />
          <StatButton
            icon="💩" label="Caca"
            count={record.poopCount}
            active={record.poopCount > 0}
            onPress={() => incrementPoop(dog.id)}
            c={c}
            noBorder={true}
          />
        </View>
      </View>
    </Pressable>
  );
}

function StatButton({
  icon, label, active, count, onPress, c, noBorder,
}: {
  icon: string; label: string; active: boolean;
  count?: number; onPress: () => void;
  c: ReturnType<typeof useColors>; noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.stat, !noBorder && { borderRightWidth: 1, borderRightColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statLabel, { color: c.fgMuted }]}>{label}</Text>
      <Text style={[styles.statVal, { color: active ? c.greenMid : c.red }]}>
        {count !== undefined ? (count > 0 ? `${count}×` : '✗') : (active ? '✓' : '✗')}
      </Text>
    </TouchableOpacity>
  );
}

function calcAge(birthDate: string): string {
  const bd = new Date(birthDate), now = new Date();
  let years = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) years--;
  if (years < 1) {
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + now.getMonth() - bd.getMonth();
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: { fontSize: 30 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 18, fontWeight: '800' },
  breed: { fontSize: 12 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginTop: 2,
  },
  pillText: { fontSize: 11, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  statIcon: { fontSize: 18 },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 11, fontWeight: '700' },
});
