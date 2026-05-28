import React, { useState } from "react";
import {
  FlatList,
  KeyboardTypeOptions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardField {
  key: string;
  label: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
}

/**
 * One option inside a `CardSelect` dropdown.
 *
 * @param label - Text displayed in the list and (once selected) in the trigger.
 * @param value - Value stored in the shared `values` record.
 */
export interface CardSelectOption {
  label: string;
  value: string;
}

/**
 * Describes a combo-box / select field rendered inside the card.
 *
 * @param key         - Unique identifier used as the state key and React `key` prop.
 * @param label       - Text displayed above the selector.
 * @param placeholder - Ghost text shown when nothing is selected yet.
 *                      Defaults to `"Seleccionar…"`.
 * @param options     - Array of `{ label, value }` options shown in the dropdown.
 */
export interface CardSelect {
  key: string;
  label: string;
  placeholder?: string;
  options: CardSelectOption[];
}

export interface CardButton {
  label: string;
  onPress?: (values: Record<string, string>) => void;
}

export interface CardTheme {
  cardBackground?: string;
  cardBorderColor?: string;
  cardBorderRadius?: number;
  primaryBackground?: string;
  primaryTextColor?: string;
  secondaryBorderColor?: string;
  secondaryTextColor?: string;
  inputBorderColor?: string;
  labelColor?: string;
  subtitleColor?: string;
}

/**
 * Props for the `<Card>` component.
 *
 * @param selects - Optional ordered list of combo-box selectors rendered
 *                  after `fields`. Their selected values are included in
 *                  the `values` snapshot forwarded to button callbacks.
 */
export interface CardProps {
  title?: string;
  subtitle?: string;
  fields?: CardField[];
  /** Combo-box / dropdown selectors rendered below the text fields. */
  selects?: CardSelect[];
  primaryButton?: CardButton;
  secondaryButton?: CardButton;
  theme?: CardTheme;
  style?: ViewStyle;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_FIELDS: CardField[] = [
  {
    key: "email",
    label: "Email",
    placeholder: "m@example.com",
    keyboardType: "email-address",
  },
  { key: "name", label: "Name", placeholder: "John Doe" },
];

const DEFAULT_THEME: Required<CardTheme> = {
  cardBackground: "#fff",
  cardBorderColor: "#e5e5e5",
  cardBorderRadius: 12,
  primaryBackground: "#111",
  primaryTextColor: "#fff",
  secondaryBorderColor: "#ccc",
  secondaryTextColor: "#444",
  inputBorderColor: "#ddd",
  labelColor: "#111",
  subtitleColor: "#666",
};

// ─── SelectField ──────────────────────────────────────────────────────────────

interface SelectFieldProps {
  config: CardSelect;
  value: string;
  theme: Required<CardTheme>;
  onChange: (value: string) => void;
}

function SelectField({ config, value, theme: t, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    config.options.find((o) => o.value === value)?.label ?? null;

  return (
    <View>
      <Text style={[styles.label, { color: t.labelColor }]}>
        {config.label}
      </Text>

      {/* Trigger */}
      <TouchableOpacity
        style={[styles.selectTrigger, { borderColor: t.inputBorderColor }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.selectTriggerText,
            !selectedLabel && styles.selectPlaceholder,
          ]}
        >
          {selectedLabel ?? config.placeholder ?? "Seleccionar…"}
        </Text>
        {/* Chevron */}
        <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {/* Modal dropdown */}
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop — tap outside to close */}
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        {/* Option list */}
        <View style={[styles.optionList, { borderColor: t.cardBorderColor }]}>
          <FlatList
            data={config.options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selected && {
                      backgroundColor: t.primaryBackground + "18",
                    },
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && {
                        color: t.primaryBackground,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <Text style={{ color: t.primaryBackground }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: t.cardBorderColor },
                ]}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * `Card` — a fully customizable form card for React Native.
 *
 * @example
 * <Card
 *   title="Crear cuenta"
 *   fields={[
 *     { key: "email",    label: "Email",    keyboardType: "email-address" },
 *     { key: "password", label: "Contraseña", secureTextEntry: true },
 *   ]}
 *   selects={[
 *     {
 *       key: "role",
 *       label: "Rol",
 *       placeholder: "Elige tu rol…",
 *       options: [
 *         { label: "Administrador", value: "admin" },
 *         { label: "Editor",        value: "editor" },
 *         { label: "Lector",        value: "reader" },
 *       ],
 *     },
 *   ]}
 *   primaryButton={{ label: "Registrarse", onPress: (v) => console.log(v) }}
 *   secondaryButton={{ label: "¿Ya tienes una cuenta?" }}
 *   theme={{ primaryBackground: "#6366f1", cardBorderRadius: 20 }}
 * />
 */
export default function Card({
  title = "Subscribe to our newsletter",
  subtitle = "Enter your details to receive updates and tips",
  fields = DEFAULT_FIELDS,
  selects = [],
  primaryButton = { label: "Subscribe" },
  secondaryButton = { label: "Later" },
  theme = {},
  style,
}: CardProps) {
  const t: Required<CardTheme> = { ...DEFAULT_THEME, ...theme };

  // Initialise controlled state for both fields and selects
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(fields.map((f) => [f.key, ""])),
    ...Object.fromEntries(selects.map((s) => [s.key, ""])),
  }));

  const handleChange = (key: string, text: string) =>
    setValues((prev) => ({ ...prev, [key]: text }));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.cardBackground,
          borderColor: t.cardBorderColor,
          borderRadius: t.cardBorderRadius,
        },
        style,
      ]}
    >
      {/* Header */}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.subtitle, { color: t.subtitleColor }]}>
        {subtitle}
      </Text>

      {/* Text input fields */}
      {fields.map((field) => (
        <View key={field.key}>
          <Text style={[styles.label, { color: t.labelColor }]}>
            {field.label}
          </Text>
          <TextInput
            style={[styles.input, { borderColor: t.inputBorderColor }]}
            placeholder={field.placeholder}
            keyboardType={field.keyboardType ?? "default"}
            secureTextEntry={field.secureTextEntry ?? false}
            value={values[field.key] ?? ""}
            onChangeText={(text) => handleChange(field.key, text)}
            autoCapitalize="none"
          />
        </View>
      ))}

      {/* Combo-box / select fields */}
      {selects.map((select) => (
        <SelectField
          key={select.key}
          config={select}
          value={values[select.key] ?? ""}
          theme={t}
          onChange={(val) => handleChange(select.key, val)}
        />
      ))}

      {/* Primary button */}
      <TouchableOpacity
        style={[
          styles.btnPrimary,
          {
            backgroundColor: t.primaryBackground,
            marginTop: selects.length ? 16 : 0,
          },
        ]}
        onPress={() => primaryButton.onPress?.(values)}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnPrimaryText, { color: t.primaryTextColor }]}>
          {primaryButton.label}
        </Text>
      </TouchableOpacity>

      {/* Secondary button */}
      <TouchableOpacity
        style={[styles.btnSecondary, { borderColor: t.secondaryBorderColor }]}
        onPress={() => secondaryButton.onPress?.(values)}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.btnSecondaryText, { color: t.secondaryTextColor }]}
        >
          {secondaryButton.label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
    marginHorizontal: 16,
    alignSelf: "stretch",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },

  // ── SelectField ──────────────────────────────────────────────────────────
  selectTrigger: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectTriggerText: {
    fontSize: 15,
    color: "#111",
    flex: 1,
  },
  selectPlaceholder: {
    color: "#aaa",
  },
  chevron: {
    fontSize: 10,
    color: "#888",
    marginLeft: 8,
  },

  // ── Modal dropdown ────────────────────────────────────────────────────────
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  optionList: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "35%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: 280,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15,
    color: "#111",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnPrimary: {
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
    marginBottom: 8,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  btnSecondary: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 13,
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: 15,
  },
});
