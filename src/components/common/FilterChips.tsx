import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  wrap?: boolean;
}

export function FilterChips<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
  wrap = false,
}: FilterChipsProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chips = options.map((option) => {
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
  });
  if (wrap) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={styles.wrapContent}>
        {chips}
      </View>
    );
  }
  return (
    <ScrollView
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {chips}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Extra trailing space makes the final option fully reachable and signals
    // that the row can scroll when there are more filters than fit on screen.
    content: { gap: spacing.xs, paddingRight: spacing.xxxl },
    wrapContent: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
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
