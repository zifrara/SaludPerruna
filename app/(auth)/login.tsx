import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/auth';

export default function LoginScreen() {
  const c = useColors();
  const { signIn, signUp, loading } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Introduce un correo electrónico válido.'); return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Introduce tu nombre.'); return;
    }

    const { error: authError } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name.trim());

    if (authError) setError(authError);
    // Si va bien, _layout.tsx detecta la sesión y redirige a /(tabs)
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={[styles.logoWrap, { backgroundColor: c.greenPale }]}>
            <Text style={styles.logoEmoji}>🐾</Text>
          </View>
          <Text style={[styles.appName, { color: c.green }]}>Salud Perruna</Text>
          <Text style={[styles.tagline, { color: c.fgMuted }]}>
            La salud de tus perritos, en familia
          </Text>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.fg }]}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Text>

            {mode === 'register' && (
              <>
                <Text style={[styles.label, { color: c.fgMuted }]}>TU NOMBRE</Text>
                <TextInput
                  style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
                  value={name}
                  onChangeText={(t) => { setName(t); setError(null); }}
                  placeholder="Como te llamas en casa"
                  placeholderTextColor={c.fgMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </>
            )}

            <Text style={[styles.label, { color: c.fgMuted }]}>CORREO ELECTRÓNICO</Text>
            <TextInput
              style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: error && !password ? c.red : c.border }]}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              placeholder="tu@correo.com"
              placeholderTextColor={c.fgMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />

            <Text style={[styles.label, { color: c.fgMuted }]}>CONTRASEÑA</Text>
            <TextInput
              style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={c.fgMuted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {error && (
              <Text style={[styles.errorText, { color: c.red }]}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: c.green }, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>
                  {mode === 'login' ? 'Entrar 🐾' : 'Crear cuenta 🐾'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle login / register */}
          <TouchableOpacity
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          >
            <Text style={[styles.toggleText, { color: c.fgMuted }]}>
              {mode === 'login'
                ? '¿Primera vez? '
                : '¿Ya tienes cuenta? '}
              <Text style={{ color: c.greenMid, fontWeight: '700' }}>
                {mode === 'login' ? 'Crear cuenta' : 'Entrar'}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 32,
    gap: 12,
  },
  logoWrap: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { fontSize: 14, marginTop: -6, marginBottom: 8 },
  card: {
    width: '100%', borderRadius: 20, borderWidth: 1.5,
    padding: 20, gap: 10,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  label: {
    fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16,
  },
  errorText: { fontSize: 12, fontWeight: '600', marginTop: -4 },
  btn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  toggleText: { fontSize: 14, marginTop: 4 },
});
