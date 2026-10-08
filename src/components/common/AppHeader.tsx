import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { commonStyles } from "../../design-system/styles";
import { colors, spacing } from "../../design-system/tokens";

interface AppHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
}
export function AppHeader({
  eyebrow,
  title,
  subtitle,
  left,
  right,
}: AppHeaderProps) {
  return (
    <View style={styles.wrap}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[commonStyles.body, styles.subtitle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  left: { marginRight: spacing.sm, paddingTop: 9 },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: spacing.xxs,
  },
  title: { color: colors.ink, fontSize: 30, fontWeight: "900", lineHeight: 35 },
  subtitle: { marginTop: spacing.xxs, maxWidth: 280 },
});
