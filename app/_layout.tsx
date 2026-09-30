import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, router, useSegments } from 'expo-router';
import { useColors } from '../src/constants/colors';
import { useDogsStore } from '../src/store/dogs';
import { useAuthStore } from '../src/store/auth';
import { supabase } from '../src/lib/supabase';
import {
  requestNotificationPermission,
  rescheduleNotifications,
  addTapListener,
} from '../src/lib/notifications';

// ─── Auth redirect ─────────────────────────────────────────────────────────────

/**
 * Tres estados posibles:
 *   1. Sin sesión → login
 *   2. Sesión sin familia → family-setup
 *   3. Sesión con familia → tabs
 *
 * "segments" no está en el array de dependencias para evitar bucles infinitos;
 * se lee en el cierre del efecto cuando session/profile cambian.
 */
function useAuthRedirect() {
  const { session, initialized, profile } = useAuthStore();
  const segments = useSegments();
  const profileFamilyId = profile?.family_id;

  useEffect(() => {
    if (!initialized) return;

    const inAuth = segments[0] === '(auth)';
    const path   = segments.join('/');

    // ── Modo offline (sin Supabase) ──────────────────────────────────────────
    if (!supabase) {
      if (inAuth) router.replace('/(tabs)');
      return;
    }

    // ── Sin sesión ───────────────────────────────────────────────────────────
    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    // ── Con sesión, sin familia → family-setup ───────────────────────────────
    if (!profileFamilyId) {
      if (!path.includes('family-setup')) router.replace('/(auth)/family-setup');
      return;
    }

    // ── Con sesión y familia → tabs ──────────────────────────────────────────
    if (inAuth) router.replace('/(tabs)');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, initialized, profileFamilyId]);
}

// ─── Root layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const c = useColors();
  const { dogs, getTodayRecord, dailyRecords } = useDogsStore();
  const { setSession, initialized, profile }   = useAuthStore();
  const { syncFromSupabase } = useDogsStore();

  // ── Auth initialization ─────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase) {
      // Offline mode — marca como inicializado inmediatamente
      setSession(null);
      return;
    }

    // Restaurar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios de auth (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session); },
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sincronizar dogs desde Supabase cuando hay familia ──────────────────

  useEffect(() => {
    if (profile?.family_id) {
      syncFromSupabase(profile.family_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id]);

  // ── Auth redirect ────────────────────────────────────────────────────────

  useAuthRedirect();

  // ── Notificaciones ───────────────────────────────────────────────────────

  useEffect(() => {
    let tapSub: ReturnType<typeof addTapListener> | undefined;

    requestNotificationPermission().then((granted) => {
      if (granted) rescheduleNotifications(dogs, getTodayRecord);
    });

    tapSub = addTapListener((route) => router.push(route as never));

    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          const { dogs: d, getTodayRecord: g } = useDogsStore.getState();
          rescheduleNotifications(d, g);
        }
      },
    );

    return () => { tapSub?.remove(); appStateSub.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reprogramar cuando cambian los datos de los perros
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    rescheduleNotifications(dogs, getTodayRecord);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogs, dailyRecords]);

  // ── Loading splash ───────────────────────────────────────────────────────

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // ── Navigation stack ─────────────────────────────────────────────────────

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.green },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '800' },
          }}
        >
          {/* Auth screens (login + family-setup) — sin header */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* Tab navigator */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Dog detail */}
          <Stack.Screen
            name="dog/[id]"
            options={{ title: '', headerStyle: { backgroundColor: c.green }, headerTintColor: '#fff' }}
          />

          {/* Dog form — modal slide-up */}
          <Stack.Screen
            name="dog/form"
            options={{
              presentation: 'modal',
              title: 'Perrito',
              headerStyle: { backgroundColor: c.green },
              headerTintColor: '#fff',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
