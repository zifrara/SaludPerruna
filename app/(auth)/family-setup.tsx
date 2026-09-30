import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/auth';

type Mode = 'choose' | 'create' | 'join' | 'done';

export default function FamilySetupScreen() {
  const c = useColors();
  const { createFamily, joinFamily, signOut, profile } = useAuthStore();

  const [mode, setMode]           = useState<Mode>('choose');
  const [familyName, setFamilyName] = useState('Mi Familia');
  const [inviteCode, setInviteCode] = useState('');
  const [resultCode, setResultCode] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Crear familia ──────────────────────────────────

  const handleCreate = async () => {
    if (!familyName.trim()) { setError('Introduce el nombre de la familia'); return; }
    setLoading(true);
    setError(null);
    const { error: err, inviteCode: code } = await createFamily(familyName.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    setResultCode(code ?? '');
    setMode('done');
    // _layout.tsx detectará que profile.family_id ya no es null y redirigirá a /(tabs)
  };

  // ── Unirse con código ──────────────────────────────

  const handleJoin = async () => {
    if (inviteCode.trim().length !== 6) { setError('El código tiene exactamente 6 caracteres'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await joinFamily(inviteCode.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    // _layout.tsx redirigirá automáticamente cuando profile.family_id cambie
  };

  // ── Pantalla "¡Familia creada!" ────────────────────

  if (mode === 'done') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.big}>🎉</Text>
          <Text style={[styles.title, { color: c.fg }]}>¡Familia creada!</Text>
          <Text style={[styles.desc, { color: c.fgMuted }]}>
            Comparte este código con tu familia para que puedan unirse:
          </Text>
          <View style={[styles.codeBox, { backgroundColor: c.greenPale, borderColor: c.green }]}>
            <Text style={[styles.codeText, { color: c.green }]}>{resultCode}</Text>
          </View>
          <Text style={[styles.desc, { color: c.fgMuted }]}>
            Podrán introducirlo al iniciar la app en{'\n'}"Unirse a una familia".
          </Text>
          <Text style={[styles.hint, { color: c.fgMuted }]}>Entrando a la app…</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Formulario: Crear ──────────────────────────────

  if (mode === 'create') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.big}>🏡</Text>
          <Text style={[styles.title, { color: c.fg }]}>Crear familia</Text>
          <Text style={[styles.desc, { color: c.fgMuted }]}>
            Crea tu espacio familiar. Recibirás un código para que tu familia se una.
          </Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.label, { color: c.fgMuted }]}>NOMBRE DE LA FAMILIA</Text>
            <TextInput
              style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
              value={familyName}
              onChangeText={(t) => { setFamilyName(t); setError(null); }}
              placeholder="Los García, Casa Perruna…"
              placeholderTextColor={c.fgMuted}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            {error ? <Text style={[styles.error, { color: c.red }]}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.green }, loading && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Crear familia 🐾</Text>
              }
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Text style={[styles.back, { color: c.fgMuted }]}>← Volver</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Formulario: Unirse ─────────────────────────────

  if (mode === 'join') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.big}>🔑</Text>
          <Text style={[styles.title, { color: c.fg }]}>Unirse a una familia</Text>
          <Text style={[styles.desc, { color: c.fgMuted }]}>
            Introduce el código de 6 letras que te dio un familiar.
          </Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.label, { color: c.fgMuted }]}>CÓDIGO DE FAMILIA</Text>
            <TextInput
              style={[styles.codeInput, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
              value={inviteCode}
              onChangeText={(t) => { setInviteCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(null); }}
              placeholder="ABC123"
              placeholderTextColor={c.fgMuted}
              autoCapitalize="characters"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            {error ? <Text style={[styles.error, { color: c.red }]}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.green }, loading && { opacity: 0.7 }]}
              onPress={handleJoin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Unirse 🐾</Text>
              }
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Text style={[styles.back, { color: c.fgMuted }]}>← Volver</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Elegir opción ──────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.big}>🐾</Text>
        <Text style={[styles.title, { color: c.fg }]}>Configura tu familia</Text>
        <Text style={[styles.desc, { color: c.fgMuted }]}>
          Hola{profile?.display_name ? `, ${profile.display_name}` : ''} 👋{'\n'}
          Para compartir los perritos con tu familia,{'\n'}crea un grupo o únete a uno existente.
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: c.greenPale, borderColor: c.green }]}
          onPress={() => setMode('create')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionEmoji}>🏡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: c.fg }]}>Crear familia</Text>
            <Text style={[styles.optionDesc, { color: c.fgMuted }]}>
              Soy el primero. Crearé el grupo y compartiré el código con el resto.
            </Text>
          </View>
          <Text style={[{ fontSize: 20 }, { color: c.fgMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => setMode('join')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionEmoji}>🔑</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: c.fg }]}>Unirme a una familia</Text>
            <Text style={[styles.optionDesc, { color: c.fgMuted }]}>
              Tengo el código de 6 letras que me dio un familiar.
            </Text>
          </View>
          <Text style={[{ fontSize: 20 }, { color: c.fgMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut} style={{ marginTop: 8 }}>
          <Text style={[styles.back, { color: c.fgMuted }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 16,
  },
  big: { fontSize: 64, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },

  card: { width: '100%', borderRadius: 20, borderWidth: 1.5, padding: 20, gap: 12 },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16,
  },
  codeInput: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 8,
  },
  error: { fontSize: 12, fontWeight: '600' },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  back: { fontSize: 14 },

  optionCard: {
    width: '100%', borderRadius: 16, borderWidth: 1.5,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  optionEmoji: { fontSize: 32 },
  optionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  optionDesc: { fontSize: 12, lineHeight: 17 },

  codeBox: {
    borderRadius: 16, borderWidth: 2,
    paddingHorizontal: 32, paddingVertical: 20,
    alignItems: 'center',
  },
  codeText: { fontSize: 36, fontWeight: '900', letterSpacing: 8 },
  hint: { fontSize: 12, marginTop: -4 },
});
