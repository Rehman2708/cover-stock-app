import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { useTheme } from "../../design-system/ThemeProvider";
import { spacing } from "../../design-system/tokens";

export function LoadingMore() {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel="Loading more results" style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.label, { color: colors.muted }]}>Loading more…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 48,
  },
  label: { fontSize: 13, fontWeight: "700" },
});
