import type { GestureResponderEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { commonStyles } from "../../design-system/styles";
import { colors, radius, spacing } from "../../design-system/tokens";
import type { Device } from "../../types/domain";
import { DeviceImage } from "./DeviceImage";
import Ionicons from "@expo/vector-icons/Ionicons";

interface DeviceCardProps {
  device: Device;
  onPress: (event: GestureResponderEvent) => void;
  showBrand?: boolean;
  unavailableCaption?: string;
}

export function DeviceCard({
  device,
  onPress,
  showBrand = true,
  unavailableCaption = "View compatible covers",
}: DeviceCardProps) {
  const unitsOnHand = device.inventory?.unitsOnHand;
  const hasKnownAvailability = unitsOnHand !== undefined;
  const availability = !hasKnownAvailability
    ? unavailableCaption
    : unitsOnHand > 0
      ? `${unitsOnHand} ${unitsOnHand === 1 ? "cover" : "covers"} available`
      : "Out of stock";
  return (
    <Pressable
      accessibilityLabel={`View ${device.brand} ${device.model} cover availability`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <DeviceImage device={device} />
      <View style={styles.copy}>
        {showBrand ? <Text style={styles.brand}>{device.brand}</Text> : null}
        <Text style={styles.model}>{device.model}</Text>
        <Text style={styles.availability}>{availability}</Text>
      </View>
      {hasKnownAvailability ? (
        <View style={[styles.count, unitsOnHand === 0 && styles.emptyCount]}>
          <Text
            style={[
              styles.countValue,
              unitsOnHand === 0 && styles.emptyCountValue,
            ]}
          >
            {unitsOnHand}
          </Text>
          <Text
            style={[
              styles.countLabel,
              unitsOnHand === 0 && styles.emptyCountValue,
            ]}
          >
            covers
          </Text>
        </View>
      ) : null}
      <Ionicons color={colors.muted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...commonStyles.card,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 76,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  brand: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  model: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  availability: { color: colors.muted, fontSize: 13 },
  count: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    minWidth: 46,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  emptyCount: { backgroundColor: colors.dangerSoft },
  countValue: { color: colors.primary, fontSize: 18, fontWeight: "900" },
  countLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyCountValue: { color: colors.danger },
});
