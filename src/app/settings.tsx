import { StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../components/common/AppHeader";
import { Screen } from "../components/common/Screen";
import { commonStyles } from "../design-system/styles";
import { colors, radius, spacing } from "../design-system/tokens";

export default function SettingsRoute() {
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="WORKSPACE"
          title="Settings"
          subtitle="Shop preferences and team controls will live here."
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.label}>CURRENT SHOP</Text>
        <Text style={styles.value}>CoverStock</Text>
        <Text style={commonStyles.caption}>Single-user MVP workspace</Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 5,
    padding: spacing.md,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  value: { color: colors.ink, fontSize: 18, fontWeight: "800" },
});
