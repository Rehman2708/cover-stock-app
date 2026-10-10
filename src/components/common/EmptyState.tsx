import { StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";
import { commonStyles } from "../../design-system/styles";
import { type ThemeColors, useThemedStyles } from "../../design-system/ThemeProvider";
import { spacing } from "../../design-system/tokens";
import { Button } from "./Button";

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <Text style={commonStyles.sectionTitle}>{title}</Text>
      <Text style={[commonStyles.body, styles.message]}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { alignItems: "center", padding: spacing.xxxl, gap: spacing.sm },
  icon: { color: colors.primary, fontSize: 32 },
  message: { textAlign: "center" },
  action: { alignSelf: "stretch", marginTop: spacing.xs },
});
