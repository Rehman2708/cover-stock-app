import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius, spacing } from "../../design-system/tokens";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  placeholder?: string;
}
export function SearchBar({
  value,
  onChangeText,
  onClear,
  onSubmit,
  loading = false,
  placeholder = "Search phone model",
}: SearchBarProps) {
  return (
    <View style={styles.form}>
      <Ionicons color={colors.muted} name="search-outline" size={21} />
      <TextInput
        accessibilityLabel="Search inventory"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Searching"
          color={colors.primary}
          style={styles.loader}
        />
      ) : null}
      {value ? (
        <Pressable
          accessibilityHint="Clears the current query"
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClear ?? (() => onChangeText(""))}
          style={({ pressed }) => [
            styles.clear,
            pressed && styles.clearPressed,
          ]}
        >
          <Text style={styles.clearLabel}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  form: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  loader: { marginLeft: spacing.sm },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
    minHeight: 48,
  },
  clear: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    marginLeft: spacing.sm,
    width: 28,
  },
  clearLabel: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 27,
  },
  clearPressed: { opacity: 0.6 },
});
