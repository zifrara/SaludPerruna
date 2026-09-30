import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/auth';

export default function CheckEmailScreen() {
  const c = useColors();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { signInWithEmail } = useAuthStore();

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    await signInWithEmail(email);
    setResending(false);
    setResent(true);
    // Reset "resent" indicator after 4 seconds
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: c.amberPale }]}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        <Text style={[styles.title, { color: c.fg }]}>Revisa tu correo</Text>

        <Text style={[styles.body, { color: c.fgMuted }]}>
          Hemos enviado un enlace mágico a{'\n'}
          <Text style={[styles.emailText, { color: c.fg }]}>{email}</Text>
        </Text>

        <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Step number="1" text="Abre el correo de Salud Perruna" c={c} />
          <Step number="2" text='Pulsa el botón "Entrar a la app"' c={c} />
          <Step number="3" text="¡Listo! La app se abrirá sola" c={c} last />
        </View>

        <Text style={[styles.spam, { color: c.fgMuted }]}>
          📁 ¿No lo encuentras? Mira en la carpeta de Spam o Promociones.
        </Text>

        {/* Resend */}
        {resent ? (
          <Text style={[styles.resentMsg, { color: c.greenMid }]}>
            ✓ Enlace reenviado
          </Text>
        ) : (
          <TouchableOpacity
            style={[styles.resendBtn, { borderColor: c.border }]}
            onPress={handleResend}
            disabled={resending}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator color={c.green} size="small" />
            ) : (
              <Text style={[styles.resendText, { color: c.fgMid }]}>
                Reenviar enlace
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Back to login */}
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.back, { color: c.fgMuted }]}>← Cambiar correo</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

function Step({
  number, text, c, last,
}: { number: string; text: string; c: any; last?: boolean }) {
  return (
    <View style={[styles.step, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <View style={[styles.stepNum, { backgroundColor: c.greenPale }]}>
        <Text style={[styles.stepNumText, { color: c.greenMid }]}>{number}</Text>
      </View>
      <Text style={[styles.stepText, { color: c.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 14,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  icon: { fontSize: 44 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  emailText: { fontWeight: '700' },
  stepsCard: {
    width: '100%', borderRadius: 16, borderWidth: 1.5,
    overflow: 'hidden', marginTop: 4,
  },
  step: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 13, fontWeight: '900' },
  stepText: { fontSize: 14, fontWeight: '500', flex: 1 },
  spam: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  resentMsg: { fontSize: 14, fontWeight: '700' },
  resendBtn: {
    paddingVertical: 12, paddingHorizontal: 28,
    borderRadius: 12, borderWidth: 1.5,
  },
  resendText: { fontSize: 14, fontWeight: '700' },
  back: { fontSize: 13, marginTop: 4 },
});
