import type { ReactNode } from "react";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius, spacing } from "../../design-system/tokens";

interface BottomSheetModalProps {
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  height?: DimensionValue;
  closeAccessibilityLabel?: string;
}

/** Shared modal shell for bottom-sheet forms and pickers. */
export function BottomSheetModal({
  children,
  visible,
  onClose,
  contentStyle,
  scrollable = false,
  height,
  closeAccessibilityLabel = "Close modal",
}: BottomSheetModalProps) {
  const dismiss = () => {
    // Android may otherwise leave the IME visible briefly while the modal is
    // closing, which can leave the next screen with a reduced layout.
    Keyboard.dismiss();
    onClose();
  };
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
  return (
    <Modal
      animationType="slide"
      onRequestClose={dismiss}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.keyboard}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel={closeAccessibilityLabel}
            accessibilityRole="button"
            onPress={dismiss}
            style={styles.dismiss}
          />
          <View style={[styles.sheet, height ? { height } : null, contentStyle]}>
            {content}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  backdrop: {
    backgroundColor: "rgba(21, 35, 31, 0.42)",
    flex: 1,
    justifyContent: "flex-end",
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "94%",
    padding: spacing.lg,
  },
  scrollView: { flexShrink: 1 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xl },
});
