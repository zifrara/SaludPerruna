import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const supabaseKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Supabase client singleton — null when credentials are not configured.
 * The app works fully offline with local Zustand state; Supabase is only
 * used for cloud sync and family sharing once you add real credentials.
 *
 * Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
 * (copy .env.example → .env) to enable cloud features.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// ─── Helpers ──────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" in local time */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Calculates age string from an ISO date string */
export function calcAge(birthDate: string): string {
  const bd = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) years--;
  if (years < 1) {
    const months = (now.getFullYear() - bd.getFullYear()) * 12 + now.getMonth() - bd.getMonth();
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

/** Formats an ISO date as "15 de septiembre de 2021" */
export function fmtDate(iso: string): string {
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y, m, d] = iso.split('-');
  return `${parseInt(d)} de ${MONTHS[parseInt(m) - 1]} de ${y}`;
}
