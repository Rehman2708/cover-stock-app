import type { ReactNode } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { commonStyles } from "../../design-system/styles";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import type { Cover, Device } from "../../types/domain";
import { DeviceImage } from "./DeviceImage";
import { StockBadge } from "./StockBadge";

type CardDevice = Pick<Device, "brand" | "model" | "images"> &
  Partial<Pick<Device, "inventory" | "compatibleDevices">>;

interface DeviceCardProps {
  device?: CardDevice;
  cover?: Cover;
  onPress?: (event: GestureResponderEvent) => void;
  showBrand?: boolean;
  showFitCount?: boolean;
  fitCount?: number;
  showAvailability?: boolean;
  quantity?: number;
  quantityLabel?: string;
  meta?: ReactNode;
  children?: ReactNode;
  unavailableCaption?: string;
}

export function DeviceCard({
  device,
  cover,
  onPress,
  showBrand,
  showFitCount = false,
  fitCount,
  showAvailability,
  quantity,
  quantityLabel = "covers",
  meta,
  children,
  unavailableCaption = "View compatible covers",
}: DeviceCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const displayedDevice =
    device ||
    cover?.displayDevice || {
      brand: "",
      model: cover?.compatibleModels?.join(" · ") || "Unlinked phone",
      images: undefined,
    };
  const compatibleCount =
    cover?.compatibleDevices?.length || cover?.compatibleModels?.length || 0;
  const displayedQuantity =
    quantity ?? cover?.quantityOnHand ?? device?.inventory?.unitsOnHand;
  const hasKnownAvailability = displayedQuantity !== undefined;
  const showDeviceBrand =
    showBrand ?? (cover ? Boolean(cover.displayDevice) : true);
  const showDeviceAvailability = showAvailability ?? !cover;
  const displayedFitCount =
    fitCount ??
    (cover
      ? compatibleCount
      : 1 + (device?.compatibleDevices?.length || 0));
  const shouldShowFitCount = showFitCount || Boolean(cover);
  const availability = !hasKnownAvailability
    ? unavailableCaption
    : displayedQuantity > 0
      ? `${displayedQuantity} ${displayedQuantity === 1 ? "cover" : "covers"} available`
      : "Out of stock";
  const cardMeta = meta ?? null;
  const inlineCoverMeta = cover && !meta ? (
    <View style={styles.inlineMeta}>
      <StockBadge cover={cover} />
      {compatibleCount ? (
        <Text style={styles.compatibility}>
          Fits {compatibleCount} {compatibleCount === 1 ? "phone" : "phones"}
        </Text>
      ) : null}
    </View>
  ) : null;
  const content = (
    <>
      <View style={styles.top}>
        <DeviceImage device={displayedDevice} size={48} />
        <View style={styles.copy}>
          {showDeviceBrand ? (
            <Text style={styles.brand}>{displayedDevice.brand}</Text>
          ) : null}
          <Text style={styles.model}>{displayedDevice.model}</Text>
          {showDeviceAvailability ? (
            <Text style={styles.availability}>{availability}</Text>
          ) : null}
          {shouldShowFitCount && !cover ? (
            <Text style={styles.compatibility}>
              Fits {displayedFitCount}{" "}
              {displayedFitCount === 1 ? "phone" : "phones"}
            </Text>
          ) : null}
          {inlineCoverMeta}
        </View>
        {hasKnownAvailability ? (
          <View
            style={[
              styles.count,
              displayedQuantity === 0 && styles.emptyCount,
            ]}
          >
            <Text
              style={[
                styles.countValue,
                displayedQuantity === 0 && styles.emptyCountValue,
              ]}
            >
              {displayedQuantity}
            </Text>
            <Text
              style={[
                styles.countLabel,
                displayedQuantity === 0 && styles.emptyCountValue,
              ]}
            >
              {quantityLabel}
            </Text>
          </View>
        ) : null}
        <Ionicons color={colors.muted} name="chevron-forward" size={20} />
      </View>
      {cardMeta ? <View style={styles.meta}>{cardMeta}</View> : null}
    </>
  );

  return (
    <View style={styles.card}>
      {onPress ? (
        <Pressable
          accessibilityLabel={`View ${displayedDevice.brand} ${displayedDevice.model} cover availability`}
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.pressable}>{content}</View>
      )}
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    ...commonStyles.card,
    minHeight: 80,
    paddingVertical: spacing.sm,
  },
  pressable: { gap: spacing.sm },
  top: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 2 },
  brand: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  model: { color: colors.ink, fontSize: 17, fontWeight: "900", lineHeight: 20 },
  availability: { color: colors.muted, fontSize: 13 },
  compatibility: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  inlineMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginLeft: 58 + spacing.sm,
  },
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
