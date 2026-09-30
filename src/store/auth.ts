import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  family_id: string | null;
}

// ─── State shape ──────────────────────────────────────

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initialized: boolean;
  loading: boolean;

  setSession: (session: Session | null) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createFamily: (name: string) => Promise<{ error: string | null; inviteCode?: string }>;
  joinFamily: (code: string) => Promise<{ error: string | null }>;
}

// ─── Store ────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,
  loading: false,

  /**
   * Called on every auth state change.
   * Loads the profile (including family_id) before marking initialized.
   */
  setSession: async (session) => {
    set({ session, user: session?.user ?? null });

    if (session && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, family_id')
        .eq('id', session.user.id)
        .single();
      set({ profile: (data as Profile | null) ?? null, initialized: true });
    } else {
      set({ profile: null, initialized: true });
    }
  },

  signIn: async (email, password) => {
    if (!supabase) { set({ initialized: true }); return { error: null }; }
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password, name) => {
    if (!supabase) { set({ initialized: true }); return { error: null }; }
    set({ loading: true });

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name } },
    });

    if (data.user && !error) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: name,
      });
    }

    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    if (!supabase) { set({ session: null, user: null, profile: null }); return; }
    await supabase.auth.signOut();
  },

  /**
   * Crea una familia nueva y vincula al usuario.
   * Devuelve el código de invitación de 6 caracteres.
   */
  createFamily: async (name) => {
    if (!supabase) return { error: null, inviteCode: 'DEMO01' };
    const userId = get().user?.id;
    if (!userId) return { error: 'No hay sesión activa' };

    // Generar código único de 6 caracteres
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let invite_code = '';
    for (let i = 0; i < 6; i++) invite_code += chars[Math.floor(Math.random() * chars.length)];

    const { data, error } = await supabase
      .from('families')
      .insert({ name, created_by: userId, invite_code })
      .select()
      .single();

    if (error || !data) return { error: error?.message ?? 'Error al crear familia' };

    // Vincular perfil del usuario a la familia
    await supabase.from('profiles').update({ family_id: data.id }).eq('id', userId);
    set((s) => ({ profile: s.profile ? { ...s.profile, family_id: data.id } : null }));

    return { error: null, inviteCode: invite_code };
  },

  /**
   * Une al usuario a una familia existente usando el código de invitación.
   */
  joinFamily: async (code) => {
    if (!supabase) return { error: null };
    const userId = get().user?.id;
    if (!userId) return { error: 'No hay sesión activa' };

    const { data, error } = await supabase
      .from('families')
      .select('id')
      .eq('invite_code', code.trim().toUpperCase())
      .single();

    if (error || !data) return { error: 'Código no encontrado. ¿Está bien escrito?' };

    await supabase.from('profiles').update({ family_id: data.id }).eq('id', userId);
    set((s) => ({ profile: s.profile ? { ...s.profile, family_id: data.id } : null }));

    return { error: null };
  },
}));
