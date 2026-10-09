import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme, type ThemeColors } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";

export interface FilterOption<T extends string> {
  label: string;
  value: T;
}
interface FilterChipsProps<T extends string> {
  accessibilityLabel: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
}: FilterChipsProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { gap: spacing.xs, paddingRight: spacing.lg },
    chip: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      minHeight: 36,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    label: { color: colors.muted, fontSize: 14, fontWeight: "800" },
    labelSelected: { color: colors.white },
    pressed: { opacity: 0.72 },
  });
