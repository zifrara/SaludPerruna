import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../src/constants/colors';

const MEMBERS = [
  { initials: 'JR', name: 'JoseRa', role: 'Administrador', last: 'Registró desayunos · 08:45', isSelf: true, bg: '#DCFCE7', fg: '#16A34A' },
  { initials: 'MA', name: 'María',  role: 'Miembro',        last: 'Sacó a Luna esta mañana ✓', isSelf: false, bg: '#DBEAFE', fg: '#1D4ED8' },
  { initials: 'CA', name: 'Carlos', role: 'Miembro',        last: 'Sacó a Max · solo pipí',    isSelf: false, bg: '#FEF9C3', fg: '#92400E' },
];

export default function FamilyScreen() {
  const c = useColors();

  const handleInvite = () => {
    Alert.alert(
      'Invitar a la familia',
      'Comparte este código con tu familia:\n\n🐾 PER-7X2',
      [{ text: 'Cerrar', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: c.bluePale }]}>
        <Text style={[styles.title, { color: c.fg }]}>Familia</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Alert */}
        <View style={[styles.alertBanner, { backgroundColor: c.redPale, borderColor: c.red }]}>
          <Text style={styles.alertIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: c.red }]}>Max necesita salir ahora</Text>
            <Text style={[styles.alertBody, { color: c.red }]}>¿Quién puede sacarlo a mediodía?</Text>
          </View>
        </View>

        {/* Members */}
        <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>Miembros</Text>
        {MEMBERS.map((m) => (
          <View key={m.name} style={[styles.memberCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.avatar, { backgroundColor: m.bg }]}>
              <Text style={[styles.avatarText, { color: m.fg }]}>{m.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: c.fg }]}>{m.name}</Text>
                {m.isSelf && (
                  <View style={[styles.selfBadge, { backgroundColor: c.greenPale }]}>
                    <Text style={[styles.selfBadgeText, { color: c.greenMid }]}>Tú</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.memberRole, { color: c.fgMuted }]}>{m.role}</Text>
              <Text style={[styles.memberLast, { color: c.fgMid }]}>{m.last}</Text>
            </View>
          </View>
        ))}

        {/* Invite button */}
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: c.blue }]}
          onPress={handleInvite}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteBtnText}>➕ Invitar a la familia</Text>
        </TouchableOpacity>

        {/* Activity feed */}
        <Text style={[styles.sectionTitle, { color: c.fgMuted }]}>Actividad reciente</Text>
        <FeedRow icon="👩" text="María sacó a Luna — pipí ✓ caca ✓" time="08:23" c={c} />
        <FeedRow icon="👦" text="Carlos sacó a Max — solo pipí" time="07:18" c={c} />
        <FeedRow icon="👨" text="JoseRa marcó desayuno de Luna y Max" time="08:45" c={c} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedRow({ icon, text, time, c }: { icon: string; text: string; time: string; c: any }) {
  return (
    <View style={[styles.feedRow, { borderBottomColor: c.border }]}>
      <Text style={styles.feedIcon}>{icon}</Text>
      <Text style={[styles.feedText, { color: c.fg }]}>{text}</Text>
      <Text style={[styles.feedTime, { color: c.fgMuted }]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900' },
  alertBanner: {
    margin: 16, marginTop: 12, borderRadius: 12,
    borderWidth: 1.5, padding: 12,
    flexDirection: 'row', gap: 10,
  },
  alertIcon: { fontSize: 20 },
  alertTitle: { fontWeight: '800', fontSize: 13, marginBottom: 2 },
  alertBody: { fontSize: 12 },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  memberCard: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 14,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 16, fontWeight: '800' },
  selfBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  selfBadgeText: { fontSize: 10, fontWeight: '700' },
  memberRole: { fontSize: 12, marginTop: 1 },
  memberLast: { fontSize: 12, marginTop: 3 },
  inviteBtn: {
    margin: 16, marginTop: 4,
    borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  inviteBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  feedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1,
  },
  feedIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  feedText: { flex: 1, fontSize: 13, lineHeight: 18 },
  feedTime: { fontSize: 11 },
});
