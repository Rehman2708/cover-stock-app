import { StyleSheet, Text, View } from "react-native";
import { commonStyles } from "../../design-system/styles";
import { type ThemeColors, useThemedStyles } from "../../design-system/ThemeProvider";
import { spacing } from "../../design-system/tokens";

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <Text style={commonStyles.sectionTitle}>{title}</Text>
      <Text style={[commonStyles.body, styles.message]}>{message}</Text>
    </View>
  );
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { alignItems: "center", padding: spacing.xxxl, gap: spacing.sm },
  icon: { color: colors.primary, fontSize: 32 },
  message: { textAlign: "center" },
});
