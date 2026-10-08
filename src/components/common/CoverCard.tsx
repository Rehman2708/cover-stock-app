import type { ReactNode } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import { StockBadge } from "./StockBadge";
import { DeviceImage } from "./DeviceImage";
import type { Cover } from "../../types/domain";

interface CoverCardProps {
  cover: Cover;
  onPress?: (event: GestureResponderEvent) => void;
  children?: ReactNode;
}
const leadingColumnWidth = 42 + spacing.sm;
export function CoverCard({ cover, onPress, children }: CoverCardProps) {
  const deviceName =
    cover.displayDevice?.model ||
    cover.compatibleModels?.join(" · ") ||
    "Unlinked phone";
  const content = (
    <>
      <View style={styles.top}>
        {cover.displayDevice ? (
          <View style={styles.image}>
            <DeviceImage device={cover.displayDevice} size={42} />
          </View>
        ) : (
          <View style={styles.icon}>
            <Text style={styles.iconText}>▣</Text>
          </View>
        )}
        <View style={styles.main}>
          {cover.displayDevice ? (
            <Text numberOfLines={1} style={styles.brand}>
              {cover.displayDevice.brand}
            </Text>
          ) : null}
          <Text numberOfLines={1} style={styles.name}>
            {deviceName}
          </Text>
        </View>
        <Text style={styles.quantity}>{cover.quantityOnHand}</Text>
      </View>
      <View style={styles.meta}>
        <StockBadge cover={cover} />
      </View>
    </>
  );
  return (
    <View style={styles.card}>
      {onPress ? (
        <Pressable
          accessibilityLabel={`Open stock details for ${deviceName}`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { ...commonStyles.card, gap: spacing.sm },
  pressed: { opacity: 0.72 },
  top: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  image: { marginRight: spacing.sm },
  iconText: { color: colors.primary, fontSize: 20 },
  main: { flex: 1, gap: 2 },
  brand: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  name: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  quantity: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: "900",
    marginLeft: spacing.sm,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    marginLeft: leadingColumnWidth,
  },
});
