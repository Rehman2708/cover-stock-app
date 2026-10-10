import { ActivityIndicator, StyleSheet, View,  } from "react-native";
import { AppText as Text, AppTextInput as TextInput } from "../../components/common/AppText";
import { router } from "expo-router";
import { AppHeader } from "../../components/common/AppHeader";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { Screen } from "../../components/common/Screen";
import { SkeletonList } from "../../components/common/Skeleton";
import { commonStyles } from "../../design-system/styles";
import {
  type ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import type { Dispatch, SetStateAction } from "react";
import type { SearchResults } from "../../types/domain";

interface SearchViewProps {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: SearchResults;
  loading: boolean;
  error: string | null;
}
export function SearchView({
  query,
  setQuery,
  results,
  loading,
  error,
}: SearchViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const searched = Boolean(query.trim());
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="FAST LOOKUP"
          title="Find a phone"
          subtitle="Search any phone model."
        />
      }
    >
      <View style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search inventory"
          autoCapitalize="words"
          autoCorrect={false}
          placeholder="Try “iPhone 15” or “A55”"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {searched &&
      loading &&
      !results.devices.length &&
      !results.covers.length ? (
        <SkeletonList count={3} variant="device" />
      ) : null}
      {searched && results.devices.length ? (
        <>
          <Text style={commonStyles.sectionTitle}>Phone models</Text>
          {results.devices.map((device, index) => (
            <DeviceCard
              device={device}
              key={`${device.id}-${index}`}
              onPress={() =>
                router.push({
                  pathname: "/device/[id]",
                  params: { id: device.id },
                })
              }
            />
          ))}
        </>
      ) : null}
      {searched && results.covers.length ? (
        <>
          <Text style={commonStyles.sectionTitle}>Stock</Text>
          {results.covers.map((cover, index) => (
            <DeviceCard
              key={`${cover.id}-${index}`}
              cover={cover}
              onPress={() =>
                router.push({
                  pathname: "/cover/[id]",
                  params: { id: cover.id },
                })
              }
            />
          ))}
        </>
      ) : null}
      {searched &&
      !loading &&
      !results.devices.length &&
      !results.covers.length ? (
        <EmptyState
          title="Nothing matched"
          message="Try a different phone model."
        />
      ) : null}
      {!searched ? (
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Quick search works across</Text>
          <Text style={styles.tip}>• Phone brands and models</Text>
          <Text style={styles.tip}>• Compatible devices</Text>
        </View>
      ) : null}
    </Screen>
  );
}
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { color: colors.primary, fontSize: 23 },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  error: {
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
  },
  errorText: { color: colors.danger, fontWeight: "700" },
  tips: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  tipsTitle: { color: colors.ink, fontWeight: "900", marginBottom: spacing.xs },
  tip: { color: colors.ink, fontSize: 14 },
});
