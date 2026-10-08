import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../design-system/tokens";
import type { Cover, StockTone } from "../../types/domain";

export function getStockState(cover: Cover): {
  label: string;
  tone: StockTone;
} {
  if (cover.quantityOnHand <= 0)
    return { label: "Out of stock", tone: "danger" };
  if (cover.quantityOnHand <= cover.reorderThreshold)
    return { label: "Low stock", tone: "warning" };
  return { label: "In stock", tone: "success" };
}
export function StockBadge({ cover }: { cover: Cover }) {
  const state = getStockState(cover);
  const badgeStyle =
    state.tone === "success"
      ? styles.success
      : state.tone === "warning"
        ? styles.warning
        : styles.danger;
  const labelStyle =
    state.tone === "success"
      ? styles.successLabel
      : state.tone === "warning"
        ? styles.warningLabel
        : styles.dangerLabel;
  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.label, labelStyle]}>{state.label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  label: { fontSize: 12, fontWeight: "800" },
  success: { backgroundColor: colors.successSoft },
  successLabel: { color: colors.success },
  warning: { backgroundColor: colors.warningSoft },
  warningLabel: { color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft },
  dangerLabel: { color: colors.danger },
});
