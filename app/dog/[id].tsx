import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useColors } from '../../src/constants/colors';
import { useDogsStore, getDogStatus } from '../../src/store/dogs';
import { calcAge, fmtDate } from '../../src/lib/supabase';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

export default function DogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { getDog, getTodayRecord, deleteDog } = useDogsStore();
  const [showDelete, setShowDelete] = useState(false);

  const dog = getDog(id!);
  if (!dog) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <Text style={{ padding: 20, color: c.fg }}>Perro no encontrado.</Text>
      </SafeAreaView>
    );
  }

  const record = getTodayRecord(dog.id);
  const status = getDogStatus(record);
  const ringColor = status === 'alert' ? c.red : status === 'warn' ? c.amber : c.green;

  const handleDelete = () => {
    deleteDog(dog.id);
    setShowDelete(false);
    router.replace('/(tabs)');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: dog.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push({ pathname: '/dog/form', params: { id: dog.id } })} style={{ marginRight: 4 }}>
              <Text style={{ color: c.blue, fontWeight: '700', fontSize: 15 }}>Editar</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: c.greenPale }]}>
          <View style={[styles.avatar, { backgroundColor: dog.bgColor, borderColor: ringColor }]}>
            <Text style={styles.avatarEmoji}>{dog.emoji}</Text>
          </View>
          <Text style={[styles.dogName, { color: c.fg }]}>{dog.name}</Text>
          <Text style={[styles.dogBreed, { color: c.fgMuted }]}>{dog.breed || 'Sin raza indicada'}</Text>
          {dog.birthDate && (
            <View style={[styles.agePill, { backgroundColor: c.greenPale, borderColor: '#BBF7D0' }]}>
              <Text style={[styles.agePillText, { color: c.greenMid }]}>{calcAge(dog.birthDate)}</Text>
            </View>
          )}
          {/* Edit / Delete buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.bluePale }]}
              onPress={() => router.push({ pathname: '/dog/form', params: { id: dog.id } })}
            >
              <Text style={[styles.actionBtnText, { color: c.blue }]}>✏️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.redPale }]}
              onPress={() => setShowDelete(true)}
            >
              <Text style={[styles.actionBtnText, { color: c.red }]}>🗑️ Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's stats */}
        <SectionTitle label="Hoy" c={c} />
        <View style={styles.todayGrid}>
          <TodayTile icon="🍳" label="Desayuno" value={record.breakfastAt ? '✓' : '✗'} ok={!!record.breakfastAt} c={c} />
          <TodayTile icon="🍖" label="Cena"     value={record.dinnerAt   ? '✓' : '✗'} ok={!!record.dinnerAt}   c={c} />
          <TodayTile icon="💧" label="Pipí hoy" value={record.peeCount > 0  ? `${record.peeCount}×`  : '✗'} ok={record.peeCount > 0}  c={c} />
          <TodayTile icon="💩" label="Caca hoy" value={record.poopCount > 0 ? `${record.poopCount}×` : '✗'} ok={record.poopCount > 0} c={c} />
        </View>

        {/* Info */}
        <SectionTitle label="Información" c={c} />
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <InfoRow icon="🎂" label="Fecha de nacimiento" value={dog.birthDate ? fmtDate(dog.birthDate) : '—'} c={c} />
          <InfoRow icon="⚖️" label="Peso" value={dog.weight ? `${dog.weight} kg` : '—'} c={c} last />
        </View>
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <InfoRow icon="🏥" label="Veterinario" value={dog.vetName || '—'} c={c} />
          <InfoRow icon="📞" label="Teléfono" value={dog.vetPhone || '—'} c={c} last />
        </View>
        {dog.notes ? (
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <InfoRow icon="📝" label="Notas" value={dog.notes} c={c} last />
          </View>
        ) : null}

        {/* Start walk */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity
            style={[styles.walkBtn, { backgroundColor: status === 'alert' ? c.red : c.green }]}
            onPress={() => router.push({ pathname: '/(tabs)/walk', params: { dogId: dog.id } })}
            activeOpacity={0.85}
          >
            <Text style={styles.walkBtnText}>
              {status === 'alert' ? '🚨 Pasear — ¡Urgente!' : `🦮 Pasear a ${dog.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={showDelete} transparent animationType="slide" onRequestClose={() => setShowDelete(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDelete(false)}>
          <Pressable style={[styles.deleteSheet, { backgroundColor: c.surface }]} onPress={() => {}}>
            <Text style={styles.deleteIcon}>⚠️</Text>
            <Text style={[styles.deleteTitle, { color: c.fg }]}>¿Eliminar a {dog.name}?</Text>
            <Text style={[styles.deleteDesc, { color: c.fgMuted }]}>
              Se borrará el perro y todo su historial de paseos y registros.{'\n'}Esta acción no se puede deshacer.
            </Text>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: c.red }]}
              onPress={handleDelete}
            >
              <Text style={styles.confirmBtnText}>Sí, eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: c.surface2, borderColor: c.border }]}
              onPress={() => setShowDelete(false)}
            >
              <Text style={[styles.cancelBtnText, { color: c.fgMid }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SectionTitle({ label, c }: { label: string; c: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>{label.toUpperCase()}</Text>
  );
}

function TodayTile({ icon, label, value, ok, c }: { icon: string; label: string; value: string; ok: boolean; c: any }) {
  return (
    <View style={[styles.todayTile, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={styles.todayTileIcon}>{icon}</Text>
      <Text style={[styles.todayTileVal, { color: ok ? c.greenMid : c.red }]}>{value}</Text>
      <Text style={[styles.todayTileLabel, { color: c.fgMuted }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, c, last }: { icon: string; label: string; value: string; c: any; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: c.fgMuted }]}>{label}</Text>
        <Text style={[styles.infoVal, { color: c.fg }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: {
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, gap: 8,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  avatarEmoji: { fontSize: 48 },
  dogName: { fontSize: 28, fontWeight: '900' },
  dogBreed: { fontSize: 14 },
  agePill: {
    paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  agePillText: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 12, flexDirection: 'row', gap: 5, alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '800' },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  todayGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16,
  },
  todayTile: {
    width: '47%', borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', padding: 14, gap: 4,
  },
  todayTileIcon: { fontSize: 26 },
  todayTileVal: { fontSize: 20, fontWeight: '900' },
  todayTileLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoVal: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  walkBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  walkBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  deleteSheet: {
    borderRadius: 24, padding: 24, margin: 0,
    alignItems: 'center', gap: 8,
  },
  deleteIcon: { fontSize: 48, marginBottom: 4 },
  deleteTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  deleteDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  confirmBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, marginTop: 4,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
});
