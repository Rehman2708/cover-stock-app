import type { ReactElement, ReactNode } from "react";
import type { RefreshControlProps } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonStyles } from "../../design-system/styles";
import { type ThemeColors } from "../../design-system/ThemeProvider";
import { colors, spacing } from "../../design-system/tokens";

interface ScreenProps {
  children: ReactNode;
  header?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  scroll?: boolean;
}
export function Screen({
  children,
  header,
  refreshControl,
  scroll = true,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={commonStyles.content}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
  return (
    <SafeAreaView edges={["top"]} style={commonStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        {header ? <View style={styles.header}>{header}</View> : null}
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function createRefreshControl(
  refreshing: boolean,
  onRefresh: NonNullable<RefreshControlProps["onRefresh"]>,
  themeColors: ThemeColors = colors,
) {
  return (
    <RefreshControl
      colors={Platform.OS === "android" ? [themeColors.primary] : undefined}
      onRefresh={onRefresh}
      progressBackgroundColor={
        Platform.OS === "android" ? themeColors.surface : undefined
      }
      refreshing={refreshing}
      tintColor={themeColors.primary}
    />
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  header: {
    backgroundColor: colors.canvas,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
});
