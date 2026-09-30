# 🐾 Salud Perruna

Aplicación móvil (iOS + Android) para registrar la salud y paseos de tus perros en familia.

**Stack:** React Native · Expo SDK 52 · Expo Router · Zustand · Supabase

---

## ⚡ Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase (opcional para primera prueba)

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase.
Si lo dejas vacío la app funciona en modo offline con datos de ejemplo en memoria.

### 3. Lanzar en el navegador

```bash
npm run web
```

---

## 📱 Probar en el móvil

Hay dos caminos según lo que necesites.

---

### Opción A — Expo Go (inmediato, gratis)

La forma más rápida de ver la app en tu móvil sin compilar nada.

> ⚠️ **Importante:** Expo Go solo funciona con la misma versión de SDK que tenga tu app.
> Esta release viene en SDK 52. Si tu Expo Go es de otra versión, sigue el paso de **Actualización** más abajo.

**Paso 1.** Instala **Expo Go** en tu móvil:
- Android: [Play Store → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iPhone: [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)

**Paso 2.** Arranca Metro en tu ordenador:

```bash
npm start
```

**Paso 3.** Escanea el QR:
- En Android: ábrelo con la app Expo Go
- En iPhone: ábrelo con la app Cámara → se abrirá Expo Go automáticamente

> ⚠️ Tu móvil y tu ordenador deben estar en la misma red Wi-Fi.
>
> ⚠️ Las notificaciones push tienen limitaciones en iOS con Expo Go. En Android funcionan sin problemas. Para iOS completo usa la Opción B.

---

### 🔄 Actualizar el SDK al que tiene tu Expo Go

Si al escanear el QR te aparece el error **"Project is incompatible with this version of Expo Go"**, tu app y tu Expo Go son de versiones distintas.

La solución es actualizar el proyecto para que coincida con tu Expo Go. Ejecuta estos dos comandos en la carpeta del proyecto:

```bash
# 1. Actualiza expo al último SDK
npx expo install expo@latest

# 2. Actualiza el resto de paquetes para que sean compatibles
npx expo install --fix
```

O como un solo comando:

```bash
npm run upgrade
```

Después vuelve a ejecutar `npm start` y escanea el QR. Ya debería funcionar.

> Estos comandos usan las propias herramientas de Expo para elegir las versiones correctas de cada paquete — es el método oficial y el más seguro.

---

### Opción B — APK real (Android) con EAS Build

Genera un fichero `.apk` que se instala directamente en cualquier Android, sin Play Store.

**Requisitos:** cuenta gratuita en [expo.dev](https://expo.dev)

```bash
# 1. Instalar EAS CLI (una sola vez)
npm install -g eas-cli

# 2. Login con tu cuenta de Expo
eas login

# 3. Vincular el proyecto (la primera vez)
eas build:configure

# 4. Generar APK instalable (tarda ~10-15 min en la nube de Expo)
eas build --platform android --profile preview
```

Al terminar, EAS te da un enlace para descargar la APK. Mándatela al móvil e instálala:

1. En Android ve a **Ajustes → Aplicaciones → Instalar apps desconocidas**
2. Actívalo para el navegador o gestor de archivos que uses
3. Abre la APK descargada → instalar

> El perfil `preview` genera una APK directamente instalable (no un AAB para la Play Store).
> Para subir a la Play Store usa el perfil `production`.

---

### Opción C — iPhone con TestFlight

En iOS Apple no permite instalar apps fuera de la App Store sin pasar por **TestFlight**. El proceso requiere una cuenta de Apple Developer (99 $/año).

```bash
# Build para iOS
eas build --platform ios --profile preview

# Subir a App Store Connect (necesita Apple Developer account)
eas submit --platform ios
```

Una vez subida, en **App Store Connect → TestFlight** invitas a tu familia por correo. Ellos instalan la app de TestFlight desde el App Store y ven la tuya sin que esté publicada públicamente.

> Sin cuenta de desarrollador, la única opción en iPhone es la Opción A (Expo Go).

---

### Comparativa rápida

| | Expo Go | APK (Android) | TestFlight (iOS) |
|---|---|---|---|
| Coste | Gratis | Gratis | 99 $/año |
| Tiempo de setup | 2 min | 15 min | 1-2 horas |
| Notificaciones push | Parcial en iOS | ✓ Completas | ✓ Completas |
| Compartir con familia | Solo en tu red Wi-Fi | ✓ Envías el APK | ✓ Invitación por email |
| Funciona sin ordenador | ✗ | ✓ | ✓ |

---

## 📱 Estructura del proyecto

```
salud-perruna/
├── app/
│   ├── _layout.tsx          # Stack raíz — auth + notificaciones
│   ├── (auth)/
│   │   ├── _layout.tsx      # Layout de autenticación
│   │   ├── login.tsx        # Pantalla de login (magic link)
│   │   └── check-email.tsx  # Confirmación de envío de email
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigator (Inicio / Paseo / Historial / Familia)
│   │   ├── index.tsx        # Pantalla de inicio — tarjetas de perros
│   │   ├── walk.tsx         # Pantalla de paseo — temporizador + pipí/caca
│   │   ├── history.tsx      # Historial de paseos
│   │   └── family.tsx       # Gestión familiar + actividad
│   └── dog/
│       ├── [id].tsx         # Perfil del perro — ver + eliminar
│       └── form.tsx         # Formulario añadir / editar perro
│
├── src/
│   ├── components/
│   │   └── DogCard.tsx      # Tarjeta de perro en la pantalla de inicio
│   ├── constants/
│   │   └── colors.ts        # Tokens de color (light/dark) + paleta de avatares
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase + helpers de fecha
│   │   └── notifications.ts # Servicio de notificaciones locales
│   ├── store/
│   │   ├── auth.ts          # Zustand store: sesión Supabase
│   │   ├── dogs.ts          # Zustand store: perros + registros diarios
│   │   └── walks.ts         # Zustand store: paseo activo + historial
│   └── types/
│       └── index.ts         # Tipos TypeScript del dominio
│
├── assets/                  # Icono y splash screen
├── .env.example             # Variables de entorno de Supabase
├── app.json                 # Configuración Expo
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 🔐 Autenticación

La app usa **Supabase Auth con magic link** (sin contraseña). Al entrar, el usuario recibe un enlace en su correo que abre la app directamente.

**Para que el enlace abra la app en el móvil**, añade la URL de redirección en Supabase:

1. Ve a **Supabase → Authentication → URL Configuration**
2. En **Redirect URLs** añade: `saludperruna://`
3. Guarda

Sin credenciales en el `.env`, la app salta el login y va directamente a la pantalla principal con datos de ejemplo.

---

## 🔔 Notificaciones

Las notificaciones son **locales** (no requieren Supabase). Se programan cada día al arrancar la app según el estado de cada perro:

| Hora | Notificación | Cuándo se envía |
|------|-------------|-----------------|
| 09:30 | 🍳 ¿[Perro] ya desayunó? | Si el desayuno no está marcado |
| 12:00, 16:00 y 20:00 | 🚨 ¡[Perro] necesita hacer caca! | Si `caca = 0` en todo el día |
| 20:30 | 🍖 ¿[Perro] ya cenó? | Si la cena no está marcada |

Al pulsar una notificación, la app navega directamente a la pantalla de paseo del perro urgente.

---

## 🗃️ Supabase: configuración completa

### A) Crear proyecto

1. Ve a [supabase.com](https://supabase.com) → New project
2. Elige región **Europe (Frankfurt)** para menor latencia desde España
3. Copia la **URL** y la **anon key** (Settings → API)
4. Pégalas en tu `.env`

> El plan **Free** de Supabase es suficiente para uso familiar (500 MB, usuarios ilimitados en la práctica). No hace falta tarjeta de crédito.

### B) Ejecutar el SQL del esquema

En Supabase → **SQL Editor**, ejecuta este script completo:

```sql
-- ─────────────────────────────────────────────────────
-- Salud Perruna — Esquema completo
-- ─────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE families (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 6),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE family_members (
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, family_id)
);

CREATE TABLE dogs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '🐕',
  bg_color   TEXT NOT NULL DEFAULT '#FEF9C3',
  breed      TEXT,
  birth_date DATE,
  weight_kg  NUMERIC(5,2),
  vet_name   TEXT,
  vet_phone  TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_records (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id       UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  breakfast_at TIMESTAMPTZ,
  dinner_at    TIMESTAMPTZ,
  pee_count    INT NOT NULL DEFAULT 0,
  poop_count   INT NOT NULL DEFAULT 0,
  UNIQUE (dog_id, date)
);

CREATE TABLE walks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dog_id           UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  distance_meters  INT,
  route_points     JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE walk_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  walk_id     UUID NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('pee','poop')),
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dogs_family       ON dogs(family_id);
CREATE INDEX idx_walks_dog         ON walks(dog_id);
CREATE INDEX idx_walks_started     ON walks(started_at DESC);
CREATE INDEX idx_daily_records_dog ON daily_records(dog_id, date DESC);
CREATE INDEX idx_walk_events_walk  ON walk_events(walk_id);

-- Row Level Security
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE walks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_events    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION my_family_ids()
RETURNS SETOF UUID LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "own profile"           ON profiles       FOR ALL USING (id = auth.uid());
CREATE POLICY "family access"         ON families       FOR ALL USING (id IN (SELECT my_family_ids()));
CREATE POLICY "family members"        ON family_members FOR ALL USING (family_id IN (SELECT my_family_ids()));
CREATE POLICY "family dogs"           ON dogs           FOR ALL USING (family_id IN (SELECT my_family_ids()));
CREATE POLICY "family daily records"  ON daily_records  FOR ALL USING (dog_id IN (SELECT id FROM dogs WHERE family_id IN (SELECT my_family_ids())));
CREATE POLICY "family walks"          ON walks          FOR ALL USING (dog_id IN (SELECT id FROM dogs WHERE family_id IN (SELECT my_family_ids())));
CREATE POLICY "family walk events"    ON walk_events    FOR ALL USING (walk_id IN (
  SELECT w.id FROM walks w JOIN dogs d ON d.id = w.dog_id WHERE d.family_id IN (SELECT my_family_ids())
));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dogs, daily_records, walks, walk_events;

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### C) Habilitar Realtime

En Supabase → **Database → Replication** activa las tablas:
`dogs`, `daily_records`, `walks`, `walk_events`

---

## 🚀 Publicar en las tiendas (EAS Build)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en expo.dev
eas login

# Configurar el proyecto (primera vez)
eas build:configure

# APK para Android (directamente instalable, sin Play Store)
eas build --platform android --profile preview

# Build de producción (Play Store / App Store)
eas build --platform all --profile production

# Enviar a las tiendas
eas submit --platform android
eas submit --platform ios
```

---

## 📋 Roadmap

- [x] Pantallas de inicio, paseo, historial y familia
- [x] CRUD completo de perros (emoji + color)
- [x] Registro diario: desayuno, cena, pipí, caca
- [x] Temporizador de paseo con log de eventos
- [x] Notificaciones locales automáticas
- [x] Login con magic link (Supabase Auth)
- [ ] Sincronización Realtime entre miembros de la familia
- [ ] Mapa GPS real con `react-native-maps`
- [ ] Invitación familiar por código QR
- [ ] Historial de peso y visitas al veterinario

---

**Proyecto:** Inredy Information Relations and Dynamics  
**Autor:** JoseRa — josera@us.es
