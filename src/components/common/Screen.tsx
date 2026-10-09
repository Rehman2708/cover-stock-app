import { useRef } from "react";
import type { ReactElement, ReactNode } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControlProps,
} from "react-native";
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
  onEndReached?: () => void;
  scroll?: boolean;
}
export function Screen({
  children,
  header,
  refreshControl,
  onEndReached,
  scroll = true,
}: ScreenProps) {
  // ScrollView can emit several events at the bottom of a single gesture.
  // Arm one pagination request per drag; callers additionally guard against a
  // pending request and an exhausted cursor before making any network call.
  const requestedEndDuringDrag = useRef(false);
  const dragStartOffset = useRef(0);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onEndReached || requestedEndDuringDrag.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Do not treat a pull-to-refresh gesture, or an upward bounce at the end,
    // as a request for another page.
    if (contentOffset.y <= dragStartOffset.current) return;
    const distanceFromEnd =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromEnd <= 160) {
      requestedEndDuringDrag.current = true;
      onEndReached();
    }
  };
  const content = scroll ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={commonStyles.content}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      onScroll={handleScroll}
      onScrollBeginDrag={(event) => {
        requestedEndDuringDrag.current = false;
        dragStartOffset.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
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
