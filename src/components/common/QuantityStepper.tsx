import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../design-system/tokens";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  minimum?: number;
  maximum?: number;
}
export function QuantityStepper({
  value,
  onChange,
  minimum = 1,
  maximum,
}: QuantityStepperProps) {
  const cannotIncrease = maximum !== undefined && value >= maximum;
  return (
    <View accessibilityLabel="Stock quantity" style={styles.wrap}>
      <Pressable
        accessibilityLabel="Decrease quantity"
        accessibilityRole="button"
        disabled={value <= minimum}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [
          styles.control,
          (pressed || value <= minimum) && styles.pressed,
        ]}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.value}>
        {value}
      </Text>
      <Pressable
        accessibilityLabel="Increase quantity"
        accessibilityRole="button"
        disabled={cannotIncrease}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [
          styles.control,
          (pressed || cannotIncrease) && styles.pressed,
        ]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  control: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  symbol: { color: colors.primary, fontSize: 28, fontWeight: "700" },
  value: { color: colors.ink, fontSize: 32, fontWeight: "900" },
  pressed: { opacity: 0.55 },
});
