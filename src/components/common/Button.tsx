import type { GestureResponderEvent } from "react-native";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { AppText as Text } from "./AppText";
import { useTheme, type ThemeColors } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "regular" | "compact";
interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  size?: ButtonSize;
}
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  size = "regular",
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const backgrounds = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
    ghost: styles.ghost,
  };
  const labels = {
    primary: styles.primaryLabel,
    secondary: styles.secondaryLabel,
    danger: styles.dangerLabel,
    ghost: styles.ghostLabel,
  };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "compact" && styles.compact,
        backgrounds[variant],
        (pressed || isDisabled) && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary}
        />
      ) : (
        <Text style={[styles.label, labels[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    compact: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primarySoft },
    danger: { backgroundColor: colors.dangerSoft },
    ghost: { backgroundColor: colors.primarySoft },
    pressed: { opacity: 0.72 },
    label: { fontSize: 15, fontWeight: "800" },
    primaryLabel: { color: colors.white },
    secondaryLabel: { color: colors.primary },
    dangerLabel: { color: colors.danger },
    ghostLabel: { color: colors.primary },
  });
