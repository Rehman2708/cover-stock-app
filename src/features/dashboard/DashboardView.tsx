import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
import { Button } from "../../components/common/Button";
import { DeviceCard } from "../../components/common/DeviceCard";
import { EmptyState } from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import { Screen, createRefreshControl } from "../../components/common/Screen";
import { commonStyles } from "../../design-system/styles";
import { useTheme, type ThemeColors } from "../../design-system/ThemeProvider";
import { radius, spacing } from "../../design-system/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatDate, titleCase } from "../../lib/format";
import type { DashboardData } from "../../types/domain";
import { router } from "expo-router";

type MetricTone = "neutral" | "warning" | "danger";
type InventoryFilter =
  | "all"
  | "in_stock"
  | "attention"
  | "low_stock"
  | "out_of_stock";
function Metric({
  label,
  value,
  tone = "neutral",
  filter = "all",
}: {
  label: string;
  value: string | number;
  tone?: MetricTone;
  filter?: InventoryFilter;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tones = {
    neutral: undefined,
    warning: styles.warning,
    danger: styles.danger,
  };
  return (
    <Pressable
      accessibilityLabel={`View ${label}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/inventory",
          params: { mode: "stock", filter },
        })
      }
      style={({ pressed }) => [
        styles.metric,
        tones[tone],
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
  );
}
interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
export function DashboardView({
  data,
  loading,
  error,
  refresh,
}: DashboardViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (loading && !data)
    return (
      <Screen
        header={
          <AppHeader
            eyebrow="COVERSTOCK"
            title="Good morning"
            subtitle="Checking your shop inventory."
          />
        }
        refreshControl={createRefreshControl(loading, refresh, colors)}
      >
        <SkeletonList variant="dashboard" />
      </Screen>
    );
  if (error)
    return (
      <Screen
        header={<AppHeader eyebrow="COVERSTOCK" title="Dashboard" />}
        refreshControl={createRefreshControl(loading, refresh, colors)}
      >
        <EmptyState title="Can’t reach your shop data" message={error} />
        <Button label="Try again" onPress={refresh} />
      </Screen>
    );
  if (!data) return null;
  const metrics = data.metrics;
  const attentionCount = metrics.lowStock + metrics.outOfStock;
  return (
    <Screen
      header={
        <AppHeader
          eyebrow="COVERSTOCK · TODAY"
          title="Shop snapshot"
          subtitle="Your inventory, exactly where you need it."
        />
      }
      refreshControl={createRefreshControl(loading, refresh, colors)}
    >
      <View style={styles.summary}>
        <Metric label="Units in stock" value={metrics.totalUnits} filter="in_stock" />
        <Metric
          label="Need attention"
          value={attentionCount}
          tone={attentionCount ? "warning" : "neutral"}
          filter="attention"
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.findAction, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="search-outline" size={22} />
          <Text style={styles.findActionLabel}>Find a phone</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.addAction, pressed && styles.pressed]}
        >
          <Ionicons color={colors.white} name="add" size={24} />
          <Text style={styles.addActionLabel}>Add stock</Text>
        </Pressable>
      </View>
      <View style={styles.sectionHead}>
        <Text style={commonStyles.sectionTitle}>Needs attention</Text>
        <Text
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/inventory", params: { mode: "stock" } })
          }
          style={styles.activityLink}
        >
          See all
        </Text>
      </View>
      {[...data.outOfStock, ...data.lowStock]
        .slice(0, 3)
        .map((cover, index) => (
          <DeviceCard
            key={`${cover.id}-${index}`}
            cover={cover}
            onPress={() =>
              router.push({ pathname: "/cover/[id]", params: { id: cover.id } })
            }
          />
        ))}
      {attentionCount === 0 ? (
        <View style={styles.good}>
          <Text style={styles.goodText}>All stock levels look healthy.</Text>
        </View>
      ) : null}
      <View style={styles.sectionHead}>
        <Text style={commonStyles.sectionTitle}>Recent activity</Text>
        <Text
          accessibilityRole="button"
          onPress={() => router.push("/activity")}
          style={styles.activityLink}
        >
          See all
        </Text>
      </View>
      {data.recentActivity.length ? (
        data.recentActivity.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            key={`${item.id}-${item.createdAt}-${index}`}
            onPress={() =>
              router.push({
                pathname: "/activity/[id]",
                params: { id: item.id },
              })
            }
            style={({ pressed }) => [
              styles.activity,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.activityDot} />
            <View style={styles.activityCopy}>
              <Text numberOfLines={1} style={styles.activityTitle}>
                {item.compatibleModels?.join(" · ") || "Phone stock update"}
              </Text>
              <Text style={commonStyles.caption}>
                {titleCase(item.type)} · {item.actor || "Shop owner"} ·{" "}
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <Text
              style={[styles.delta, item.quantityDelta < 0 && styles.deltaOut]}
            >
              {item.quantityDelta > 0 ? "+" : ""}
              {item.quantityDelta}
            </Text>
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="No activity yet"
          message="Sales and restocks will appear here."
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  summary: { flexDirection: "row", gap: spacing.sm },
  metric: {
    flex: 1,
    minHeight: 92,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.72 },
  warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningSoft,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  metricValue: { color: colors.ink, fontSize: 27, fontWeight: "900" },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  findAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 52,
  },
  findActionLabel: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  addAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 52,
  },
  addActionLabel: { color: colors.white, fontSize: 15, fontWeight: "900" },
  activityLink: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  good: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.successSoft,
  },
  goodText: { color: colors.success, fontWeight: "800" },
  activity: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  activityCopy: { flex: 1 },
  activityTitle: { color: colors.ink, fontWeight: "800", marginBottom: 2 },
  delta: { color: colors.success, fontWeight: "900", fontSize: 17 },
  deltaOut: { color: colors.danger },
});
