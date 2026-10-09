import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius } from "../../design-system/tokens";
import type { Device } from "../../types/domain";

interface DeviceImageProps {
  device: Pick<Device, "brand" | "model" | "images">;
  size?: number;
  showFallbackLabel?: boolean;
}
export function DeviceImage({
  device,
  size = 58,
  showFallbackLabel = false,
}: DeviceImageProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const uri = device.images?.primary || device.images?.back;
  if (uri)
    return (
      <Image
        accessibilityLabel={`${device.brand} ${device.model}`}
        resizeMode="contain"
        source={{ uri }}
        style={[styles.image, { height: size, width: size }]}
      />
    );
  return (
    <View
      accessibilityLabel={`${device.brand} ${device.model}, photo unavailable`}
      style={[styles.fallback, { height: size, width: size }]}
    >
      <Ionicons
        color={colors.primary}
        name="phone-portrait-outline"
        size={Math.max(
          24,
          Math.round(size * (showFallbackLabel ? 0.38 : 0.48)),
        )}
      />
      {showFallbackLabel ? (
        <Text style={styles.label}>Photo unavailable</Text>
      ) : null}
    </View>
  );
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  image: { backgroundColor: colors.primarySoft, borderRadius: radius.md },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    padding: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
    textAlign: "center",
  },
});
