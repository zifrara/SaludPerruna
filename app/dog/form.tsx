import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useColors, DOG_EMOJIS, DOG_BG_COLORS } from '../../src/constants/colors';
import { useDogsStore } from '../../src/store/dogs';
import type { DogFormData } from '../../src/types';

const DEFAULT_FORM: DogFormData = {
  name: '', emoji: '🐕', bgColor: '#FEF9C3',
  breed: '', birthDate: '', weight: '',
  vetName: '', vetPhone: '', notes: '',
};

export default function DogFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const c = useColors();
  const { getDog, addDog, updateDog } = useDogsStore();
  const isEdit = !!id;

  const [form, setForm] = useState<DogFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof DogFormData, string>>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const dog = getDog(id);
      if (dog) {
        setForm({
          name: dog.name,
          emoji: dog.emoji,
          bgColor: dog.bgColor,
          breed: dog.breed ?? '',
          birthDate: dog.birthDate ?? '',
          weight: dog.weight ? String(dog.weight) : '',
          vetName: dog.vetName ?? '',
          vetPhone: dog.vetPhone ?? '',
          notes: dog.notes ?? '',
        });
      }
    }
  }, [id]);

  const set = (field: keyof DogFormData) => (val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      emoji: form.emoji,
      bgColor: form.bgColor,
      breed: form.breed.trim(),
      birthDate: form.birthDate || undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      vetName: form.vetName.trim() || undefined,
      vetPhone: form.vetPhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (isEdit && id) {
      updateDog(id, data);
      router.back();
    } else {
      const dog = addDog(data);
      router.replace(`/dog/${dog.id}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? `Editar a ${form.name || '...'}` : 'Nuevo perrito' }} />

      <ScrollView
        style={{ flex: 1, backgroundColor: c.surface }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <Pressable
            style={[styles.avatarCircle, { backgroundColor: form.bgColor, borderColor: c.green }]}
            onPress={() => setShowEmojiPicker((v) => !v)}
          >
            <Text style={styles.avatarEmoji}>{form.emoji}</Text>
          </Pressable>
          <Text style={[styles.avatarHint, { color: c.fgMuted }]}>Toca para cambiar avatar</Text>

          {showEmojiPicker && (
            <View style={[styles.emojiGrid, { backgroundColor: c.surface2, borderColor: c.border }]}>
              {DOG_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOpt, form.emoji === e && { backgroundColor: c.greenPale }]}
                  onPress={() => { setForm((f) => ({ ...f, emoji: e })); }}
                >
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </TouchableOpacity>
              ))}
              {/* Color row */}
              <View style={styles.colorRow}>
                {DOG_BG_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: col },
                      form.bgColor === col && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, bgColor: col }))}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Basic info */}
        <FormSectionTitle label="Datos básicos" c={c} />

        <Field label="Nombre" required error={errors.name} c={c}>
          <TextInput
            style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: errors.name ? c.red : c.border }]}
            value={form.name}
            onChangeText={set('name')}
            placeholder="Ej: Luna"
            placeholderTextColor={c.fgMuted}
            maxLength={30}
          />
        </Field>

        <Field label="Raza" c={c}>
          <TextInput
            style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
            value={form.breed}
            onChangeText={set('breed')}
            placeholder="Ej: Golden Retriever"
            placeholderTextColor={c.fgMuted}
            maxLength={50}
          />
        </Field>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Nacimiento" c={c}>
              <TextInput
                style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
                value={form.birthDate}
                onChangeText={set('birthDate')}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={c.fgMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Peso (kg)" c={c}>
              <TextInput
                style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
                value={form.weight}
                onChangeText={set('weight')}
                placeholder="28.5"
                placeholderTextColor={c.fgMuted}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </Field>
          </View>
        </View>

        {/* Vet */}
        <FormSectionTitle label="Veterinario" c={c} />

        <Field label="Nombre del veterinario" c={c}>
          <TextInput
            style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
            value={form.vetName}
            onChangeText={set('vetName')}
            placeholder="Dr. Pérez"
            placeholderTextColor={c.fgMuted}
          />
        </Field>

        <Field label="Teléfono" c={c}>
          <TextInput
            style={[styles.input, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
            value={form.vetPhone}
            onChangeText={set('vetPhone')}
            placeholder="600 123 456"
            placeholderTextColor={c.fgMuted}
            keyboardType="phone-pad"
          />
        </Field>

        {/* Notes */}
        <FormSectionTitle label="Notas" c={c} />

        <Field label="Observaciones" c={c}>
          <TextInput
            style={[styles.input, styles.textarea, { color: c.fg, backgroundColor: c.surface2, borderColor: c.border }]}
            value={form.notes}
            onChangeText={set('notes')}
            placeholder="Alergias, medicación, comportamiento especial…"
            placeholderTextColor={c.fgMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Field>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: c.green }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {isEdit ? 'Guardar cambios ✓' : 'Guardar perrito 🐾'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function FormSectionTitle({ label, c }: { label: string; c: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: c.fgMuted, borderTopColor: c.border }]}>{label}</Text>
  );
}

function Field({
  label, required, error, children, c,
}: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; c: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.fgMuted }]}>
        {label.toUpperCase()}{required && <Text style={{ color: c.red }}> *</Text>}
      </Text>
      {children}
      {error && <Text style={[styles.fieldError, { color: c.red }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 8, gap: 8 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  avatarEmoji: { fontSize: 44 },
  avatarHint: { fontSize: 12, fontWeight: '600' },
  emojiGrid: {
    borderRadius: 14, borderWidth: 1.5,
    padding: 10,
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    justifyContent: 'center', width: '100%',
  },
  emojiOpt: { padding: 6, borderRadius: 8 },
  colorRow: {
    flexDirection: 'row', gap: 8, marginTop: 6,
    justifyContent: 'center', width: '100%',
  },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchSelected: { borderColor: '#22C55E', transform: [{ scale: 1.2 }] },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.8, paddingTop: 16, paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  fieldError: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  textarea: { minHeight: 80 },
  saveBtn: {
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
