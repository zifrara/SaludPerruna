// ─────────────────────────────────────────────
// Core domain types for Salud Perruna
// ─────────────────────────────────────────────

export interface Dog {
  id: string;
  familyId: string;
  name: string;
  emoji: string;
  bgColor: string;
  breed?: string;
  birthDate?: string;      // ISO date string "YYYY-MM-DD"
  weight?: number;         // kg
  vetName?: string;
  vetPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  dogId: string;
  date: string;            // "YYYY-MM-DD"
  breakfastAt?: string;    // ISO datetime
  dinnerAt?: string;
  peeCount: number;
  poopCount: number;
  lastPeeAt?: string;      // ISO datetime del último pipí
  lastPoopAt?: string;     // ISO datetime de la última caca
  walkCount: number;       // nº de paseos terminados hoy (con o sin eventos)
  lastWalkAt?: string;     // ISO datetime del último paseo terminado
}

export interface Walk {
  id: string;
  dogId: string;
  userId: string;
  startedAt: string;       // ISO datetime
  endedAt?: string;
  distanceMeters?: number;
  routePoints?: RoutePoint[];
}

export interface RoutePoint {
  lat: number;
  lng: number;
  ts: number;              // Unix timestamp ms
}

export interface WalkEvent {
  id: string;
  walkId: string;
  type: 'pee' | 'poop';
  lat?: number;
  lng?: number;
  recordedAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
}

export interface FamilyMember {
  userId: string;
  familyId: string;
  role: 'admin' | 'member';
  displayName: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

// ─── UI-only state types ───────────────────

/** Daily state merged on the client for the home screen */
export interface DogWithTodayStats extends Dog {
  todayRecord: DailyRecord;
  status: 'ok' | 'alert' | 'warn';
}

export type ActiveWalkState = {
  walkId: string;
  dogId: string;
  startedAt: Date;
  elapsedSeconds: number;
  distanceKm: number;
  peeCount: number;
  poopCount: number;
  events: { type: 'pee' | 'poop'; time: Date }[];
} | null;

// ─── Form types ───────────────────────────

export interface DogFormData {
  name: string;
  emoji: string;
  bgColor: string;
  breed: string;
  birthDate: string;
  weight: string;
  vetName: string;
  vetPhone: string;
  notes: string;
}
