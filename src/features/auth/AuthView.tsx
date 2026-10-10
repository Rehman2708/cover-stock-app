import { useState } from "react";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText as Text, AppTextInput as TextInput } from "../../components/common/AppText";
import { Button } from "../../components/common/Button";
import { Screen } from "../../components/common/Screen";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import { useAuth } from "./AuthProvider";
import {
  normalizePhone,
  type AuthField,
  type AuthFieldErrors,
  type AuthMode,
  validateAuthInput,
} from "./authValidation";

export function AuthView() {
  const styles = useThemedStyles(createStyles);
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>(
    {},
  );

  const updateField = (field: AuthField, value: string) => {
    if (field === "name") setName(value);
    if (field === "phone") setPhone(value);
    if (field === "password") setPassword(value);
    setFormError(null);
    if (touched[field]) {
      const nextInput = { name, phone, password, [field]: value };
      setErrors(validateAuthInput(mode, nextInput));
    }
  };
  const markTouched = (field: AuthField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors(validateAuthInput(mode, { name, phone, password }));
  };
  const submit = async () => {
    const input = { name, phone, password };
    const nextErrors = validateAuthInput(mode, input);
    setErrors(nextErrors);
    setTouched({ name: true, phone: true, password: true });
    setFormError(null);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      if (mode === "register")
        await register(name.trim(), normalizedPhone, password);
      else await login(normalizedPhone, password);
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : "Unable to continue.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const switchMode = () => {
    setFormError(null);
    setErrors({});
    setTouched({});
    setMode((current) => (current === "login" ? "register" : "login"));
  };
  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>COVERSTOCK</Text>
          <Text style={styles.title}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Log in to check and update cover availability."
              : "Your name will appear on every stock update you make."}
          </Text>
        </View>
        <View style={styles.card}>
          {mode === "register" ? (
            <Field
              label="Your name"
              value={name}
              onBlur={() => markTouched("name")}
              onChangeText={(value) => updateField("name", value)}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoComplete="name"
              error={touched.name ? errors.name : undefined}
            />
          ) : null}
          <Field
            label="Phone number"
            value={phone}
            onBlur={() => markTouched("phone")}
            onChangeText={(value) => updateField("phone", value)}
            placeholder="e.g. +91 98765 43210"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={24}
            error={touched.phone ? errors.phone : undefined}
          />
          <PasswordField
            value={password}
            visible={passwordVisible}
            onBlur={() => markTouched("password")}
            onChangeText={(value) => updateField("password", value)}
            onToggleVisibility={() => setPasswordVisible((current) => !current)}
            placeholder={
              mode === "register"
                ? "8+ characters, letter and number"
                : "Enter your password"
            }
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            textContentType={mode === "register" ? "newPassword" : "password"}
            error={touched.password ? errors.password : undefined}
          />
          {formError ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {formError}
            </Text>
          ) : null}
          <Button
            label={mode === "login" ? "Log in" : "Create account"}
            loading={submitting}
            onPress={submit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              mode === "login"
                ? "Create a new account"
                : "Log in to an existing account"
            }
            onPress={switchMode}
            style={({ pressed }) => [styles.switch, pressed && styles.pressed]}
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Log in"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ? `Error: ${error}` : undefined}
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function PasswordField({
  visible,
  onToggleVisibility,
  error,
  ...props
}: Omit<ComponentProps<typeof TextInput>, "secureTextEntry" | "maxLength"> & {
  visible: boolean;
  onToggleVisibility: () => void;
  error?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Password</Text>
      <View style={[styles.passwordInputWrap, error && styles.inputError]}>
        <TextInput
          accessibilityLabel="Password"
          accessibilityHint={error ? `Error: ${error}` : undefined}
          autoCorrect={false}
          placeholderTextColor={colors.muted}
          secureTextEntry={!visible}
          style={styles.passwordInput}
          maxLength={128}
          {...props}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityState={{ expanded: visible }}
          hitSlop={spacing.xs}
          onPress={onToggleVisibility}
          style={({ pressed }) => [
            styles.visibilityButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.visibilityText}>{visible ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  hero: { gap: spacing.xs },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  title: { color: colors.ink, fontSize: 32, fontWeight: "900", lineHeight: 38 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  input: {
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  passwordInputWrap: {
    alignItems: "center",
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
  },
  passwordInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  visibilityButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 52,
    paddingHorizontal: spacing.sm,
  },
  visibilityText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  inputError: { borderColor: colors.danger },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    color: colors.danger,
    fontWeight: "700",
    padding: spacing.md,
  },
  switch: { alignItems: "center", minHeight: 44, justifyContent: "center" },
  switchText: { color: colors.primary, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
